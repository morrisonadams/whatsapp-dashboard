import json
import os
from typing import Any, Dict, List

import pandas as pd
from openai import OpenAI


def _month_groups(df: pd.DataFrame) -> Dict[str, pd.DataFrame]:
    """Group a message dataframe by month."""
    if df.empty:
        return {}
    d = df.copy()
    d["month"] = d["ts"].dt.to_period("M")
    groups: Dict[str, pd.DataFrame] = {}
    for period, sub in d.groupby("month"):
        groups[str(period)] = sub.sort_values("ts")
    return groups


def _analyze_month(month: str, df: pd.DataFrame, client: OpenAI, model: str) -> Dict[str, Any]:
    """Send one month's chat to the model and parse conflict info."""
    lines = [f"{row['ts']:%Y-%m-%d}: {row['text']}" for _, row in df.iterrows()]
    prompt = (
        "You are an assistant that finds conflicts in chat logs. "
        "Return JSON with keys 'total_conflicts' and 'conflicts'. "
        "Each conflict entry should have 'date' (YYYY-MM-DD) and 'summary'.\n\n"
        f"Chat log for {month}:\n" + "\n".join(lines)
    )
    resp = client.responses.create(
        model=model,
        input=prompt,
        response_format={"type": "json_object"},
    )
    # The Responses API exposes a convenience property that contains
    # the concatenated text for the assistant's message.  Using this is
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
    data["month"] = month
    return data


def analyze_conflicts_by_month(df: pd.DataFrame, model: str = "gpt-5-nano") -> List[Dict[str, Any]]:
    """Analyze conflicts in chat history month by month using an LLM."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    client = OpenAI(api_key=api_key)
    results: List[Dict[str, Any]] = []
    for month, sub in _month_groups(df).items():
        results.append(_analyze_month(month, sub, client, model))
    return results
