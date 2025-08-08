import asyncio
import json
import os
from typing import Any, AsyncIterator, Dict, List, Tuple

import pandas as pd
from openai import AsyncOpenAI


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
        "You are an expert assistant in analyzing chat logs for substantive interpersonal conflicts—"
        "moments where one or both people experience real misalignment, emotional pain, disappointment, "
        "or confusion (not just playful teasing). "
        "Return only legitimate, emotionally significant conflicts. Ignore brattiness, playful criticisms, "
        "and ongoing teasing unless they escalate into real misunderstandings, new boundaries, or feelings of hurt. "
        "Focus solely on disagreements between the two people in this conversation; disregard conflicts involving third parties unless they create tension between them.\n"
        "Output JSON with:\n"
        "total_conflicts: integer, count of significant or potentially relationship-altering conflicts.\n"
        "conflicts: an array of objects, each with:\n"
        "date (YYYY-MM-DD): first date where the conflict became visible.\n"
        "summary: a concise, objective description in neutral tone of the disagreement or misalignment, including both perspectives if possible.\n\n"
        f"Chat log for {period}:\n" + "\n".join(lines)
    )


async def _analyze_period_async(
    period: str,
    df: pd.DataFrame,
    client: AsyncOpenAI,
    model: str,
    sem: asyncio.Semaphore,
) -> Dict[str, Any]:
    """Send one period's chat to the model and parse conflict info."""
    prompt = _build_prompt(period, df)
    async with sem:
        resp = await client.responses.create(model=model, input=prompt)
    # The Responses API exposes a convenience property that contains
    # the concatenated text for the assistant's message. Using this is
    # more robust than reaching into the nested `output` structure,
    # which has changed across SDK versions and previously raised
    # attribute errors, resulting in 500s when fetching conflicts.
    content = (resp.output_text or "").strip()
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        data = {"total_conflicts": 0, "conflicts": []}
    data.setdefault("conflicts", [])
    data.setdefault("total_conflicts", len(data["conflicts"]))
    data["period"] = period
    return data


async def analyze_conflicts(
    df: pd.DataFrame,
    model: str = "gpt-4.1-mini",
    max_concurrency: int = 5,
) -> List[Dict[str, Any]]:
    """Analyze conflicts in chat history by two-week periods using an LLM."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    client = AsyncOpenAI(api_key=api_key)
    groups = _fortnight_groups(df)
    sem = asyncio.Semaphore(max_concurrency)
    tasks = [
        _analyze_period_async(period, sub, client, model, sem)
        for period, sub in groups.items()
    ]
    results = await asyncio.gather(*tasks)
    return sorted(results, key=lambda x: x["period"])


async def stream_conflicts(
    df: pd.DataFrame,
    model: str = "gpt-4.1-mini",
    max_concurrency: int = 5,
) -> AsyncIterator[Tuple[int, int, Dict[str, Any]]]:
    """Yield conflict analysis period by period with progress info."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    client = AsyncOpenAI(api_key=api_key)
    groups = _fortnight_groups(df)
    sem = asyncio.Semaphore(max_concurrency)
    tasks = [
        asyncio.create_task(_analyze_period_async(period, sub, client, model, sem))
        for period, sub in groups.items()
    ]
    total = len(tasks)
    completed = 0
    for fut in asyncio.as_completed(tasks):
        result = await fut
        completed += 1
        yield completed, total, result

