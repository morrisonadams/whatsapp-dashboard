import asyncio
import hashlib
import json
import os
from pathlib import Path
from typing import Any, AsyncIterator, Dict, List, Optional, Tuple

import pandas as pd
from openai import AsyncOpenAI


CACHE_FILE = Path(__file__).with_name("highlight_cache.json")
_CACHE: Dict[str, Any] = {}

# Default concurrency can be tuned via the ``CONFLICT_MAX_CONCURRENCY``
# environment variable. Falling back to the CPU count (or 10 if that cannot
# be determined) provides good parallelism without overwhelming the API. Higher
# values speed up processing but may hit rate limits or increase memory usage.
DEFAULT_MAX_CONCURRENCY = max(
    1, int(os.getenv("CONFLICT_MAX_CONCURRENCY", 0)) or (os.cpu_count() or 10)
)


def _load_cache() -> None:
    """Load cache from disk if available."""
    global _CACHE
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            _CACHE = json.load(f)
    except FileNotFoundError:
        _CACHE = {}


def _save_cache() -> None:
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(_CACHE, f)


def _hash_period(df: pd.DataFrame) -> str:
    lines = [f"{row['ts']:%Y-%m-%d}: {row['text']}" for _, row in df.iterrows()]
    text = "\n".join(lines)
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


_load_cache()


def _fortnight_groups(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
    """Group a message dataframe into two-week periods."""
    if df.empty:
        return {}
    d = df.copy()
    d["period"] = d["ts"].dt.to_period("2W")
    groups: Dict[str, pd.DataFrame] = {}
    for period, sub in d.groupby("period"):
        groups[str(period)] = sub.sort_values("ts")
    return groups


def _build_prompt(period: str, df: pd.DataFrame) -> str:
    """Construct the prompt text for a single two-week period."""
    lines = [f"{row['ts']:%Y-%m-%d}: {row['text']}" for _, row in df.iterrows()]
    return (
        "You are an expert assistant in analyzing chat logs for exceptionally positive moments—"
        "instances of heartfelt appreciation, mutual excitement, emotional intimacy, or other genuinely special exchanges. "
        "Report only moments that clearly stand out as meaningful to the relationship. Ignore everyday chit-chat, routine compliments, or light banter.\n"
        "If there are no such moments in this period, respond with total_highlights: 0 and an empty highlights array.\n"
        "Output JSON with:\n"
        "total_highlights: integer, count of unique special moments.\n"
        "highlights: an array of objects, each with:\n"
        "date (YYYY-MM-DD): first date where the moment occurred.\n"
        "summary: a concise, objective description in neutral tone of the positive moment or conversation.\n\n"
        f"Chat log for {period}:\n" + "\n".join(lines)
    )


async def _analyze_period_async(
    period: str,
    df: pd.DataFrame,
    client: AsyncOpenAI,
    model: str,
    sem: asyncio.Semaphore,
) -> Dict[str, Any]:
    """Send one period's chat to the model and parse highlight info."""
    prompt = _build_prompt(period, df)
    async with sem:
        resp = await client.responses.create(model=model, input=prompt)
    # The Responses API exposes a convenience property that contains
    # the concatenated text for the assistant's message. Using this is
    # more robust than reaching into the nested `output` structure,
    # which has changed across SDK versions and previously raised
    # attribute errors, resulting in 500s when fetching highlights.
    content = (resp.output_text or "").strip()
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        data = {"total_highlights": 0, "highlights": []}
    data.setdefault("highlights", [])
    data.setdefault("total_highlights", len(data["highlights"]))
    data["period"] = period
    return data


async def _analyze_with_cache(
    period: str,
    df: pd.DataFrame,
    client: AsyncOpenAI,
    model: str,
    sem: asyncio.Semaphore,
) -> Dict[str, Any]:
    """Check cache before analyzing a period."""
    key = _hash_period(df)
    if key in _CACHE:
        return _CACHE[key]
    data = await _analyze_period_async(period, df, client, model, sem)
    _CACHE[key] = data
    _save_cache()
    return data


async def analyze_highlights(
    df: pd.DataFrame,
    model: str = "gpt-5-nano",
    max_concurrency: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Analyze highlights in chat history by two-week periods using an LLM.

    Parameters
    ----------
    max_concurrency: Optional[int]
        Maximum number of concurrent API requests. If ``None`` (default), the
        value from the ``CONFLICT_MAX_CONCURRENCY`` environment variable is
        used, falling back to the number of CPUs on the machine. Higher values
        complete analysis faster but may hit API rate limits or use more
        memory; lower values are safer but slower.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    client = AsyncOpenAI(api_key=api_key)
    groups = _fortnight_groups(df)
    if max_concurrency is None:
        max_concurrency = DEFAULT_MAX_CONCURRENCY
    sem = asyncio.Semaphore(max_concurrency)
    tasks = [
        _analyze_with_cache(period, sub, client, model, sem)
        for period, sub in groups.items()
    ]
    results = await asyncio.gather(*tasks)
    return sorted(results, key=lambda x: x["period"])


def periods_to_months(periods: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Aggregate two-week period results into calendar months."""
    months: Dict[str, Dict[str, Any]] = {}
    for p in periods:
        for c in p.get("highlights", []):
            try:
                dt = pd.to_datetime(c.get("date"))
            except Exception:
                continue
            month_key = dt.strftime("%Y-%m")
            month_entry = months.setdefault(
                month_key, {"month": month_key, "total_highlights": 0, "highlights": []}
            )
            month_entry["highlights"].append(c)
            month_entry["total_highlights"] += 1
    for m in months.values():
        m["highlights"].sort(key=lambda x: x.get("date", ""))
    # Ensure months are returned in chronological order
    return [months[m] for m in sorted(months)]


async def stream_highlights(
    df: pd.DataFrame,
    model: str = "gpt-5-nano",
    max_concurrency: Optional[int] = None,
) -> AsyncIterator[Tuple[int, int, Dict[str, Any]]]:
    """Yield highlight analysis period by period with progress info.

    See :func:`analyze_highlights` for discussion of the ``max_concurrency``
    parameter and trade-offs between speed and resource usage.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    client = AsyncOpenAI(api_key=api_key)
    groups = _fortnight_groups(df)
    if max_concurrency is None:
        max_concurrency = DEFAULT_MAX_CONCURRENCY
    sem = asyncio.Semaphore(max_concurrency)
    tasks = [
        asyncio.create_task(_analyze_with_cache(period, sub, client, model, sem))
        for period, sub in groups.items()
    ]
    total = len(tasks)
    completed = 0
    for fut in asyncio.as_completed(tasks):
        result = await fut
        completed += 1
        yield completed, total, result

