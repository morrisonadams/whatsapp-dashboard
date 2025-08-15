from __future__ import annotations

import datetime as dt
import json
import os
from typing import Any, Dict, List

from openai import OpenAI

from parse import Message
from themes import THEMES, mood_to_color


class DailyThemesError(ValueError):
    """Raised when the model returns malformed daily theme data."""

PROMPT_TEMPLATE = (
    "You are an assistant categorizing daily conversation themes.\n"
    "Given the chat transcript between {date_range} in timezone {timezone},\n"
    "analyze each day's messages and summarize the prevailing mood.\n"
    "Return a JSON object mapping each date (YYYY-MM-DD) to an object with:\n"
    "  mood_pct: integer 0-100 representing overall mood, and\n"
    "  dominant_theme: object {{\"id\": <theme_id>}} where theme_id is one of:\n"
    "    0 conflict, 1 repair, 2 affection, 3 humor, 4 logistics,\n"
    "    5 support, 6 celebration, 7 planning, 8 question, 9 other.\n"
    "Example: {{\"2024-01-01\": {{\"mood_pct\": 75, \"dominant_theme\": {{\"id\": 2}}}}}}\n"
    "Transcript:\n{transcript}"
)


def _build_transcript(msgs: List[Message], tz: dt.tzinfo) -> str:
    lines: List[str] = []
    for m in sorted(msgs, key=lambda x: x.ts):
        ts = m.ts
        if tz is not None:
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=tz)
            else:
                ts = ts.astimezone(tz)
        speaker = m.sender or "system"
        text = m.text or ""
        lines.append(f"{ts.isoformat()} - {speaker}: {text}")
    return "\n".join(lines)


def analyze_range(
    start: dt.date, end: dt.date, msgs: List[Message], tz: dt.tzinfo
) -> Dict[str, Any]:
    transcript = _build_transcript(msgs, tz)
    date_range = f"{start.isoformat()} to {end.isoformat()}"
    prompt = PROMPT_TEMPLATE.format(
        date_range=date_range, transcript=transcript, timezone=str(tz)
    )
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    client = OpenAI(api_key=api_key)
    try:
        resp = client.responses.create(
            model="gpt-5-nano", input=prompt, response_format={"type": "json_object"}
        )
        content = (resp.output_text or "").strip()
        return parse_days_json(content, start, end, tz)
    except Exception:
        # Gracefully fall back to an empty result if the model output cannot be
        # parsed or the API request fails. This mirrors the robustness of the
        # conflict analysis which never propagates errors to callers.
        return {
            "range_start": start.isoformat(),
            "range_end": end.isoformat(),
            "timezone": str(tz),
            "days": [],
        }


def parse_days_json(content: str, start: dt.date, end: dt.date, tz: dt.tzinfo) -> Dict[str, Any]:
    """Parse the model JSON output for a 14-day range.

    Parameters
    ----------
    content:
        Raw JSON string returned by the model.
    start, end:
        Start and end dates of the 14-day range.
    tz:
        Timezone used for analysis.

    Returns
    -------
    Dict[str, Any]
        Structured dictionary with days sorted chronologically and range info.

    Raises
    ------
    DailyThemesError
        If the JSON is malformed or contains invalid theme identifiers.
    """

    try:
        raw = json.loads(content)
    except json.JSONDecodeError as exc:
        raise DailyThemesError(f"Malformed JSON: {exc.msg}") from exc

    if not isinstance(raw, dict):
        raise DailyThemesError("Top-level JSON must be an object mapping dates")

    days: List[Dict[str, Any]] = []
    for date_str, info in raw.items():
        if not isinstance(info, dict):
            raise DailyThemesError(f"Day entry for {date_str} must be an object")

        # Normalize mood color
        mood_pct = (
            info.get("mood_pct")
            or info.get("mood_percent")
            or info.get("mood")
            or 0
        )
        info["color_hex"] = mood_to_color(int(mood_pct))

        dom = info.get("dominant_theme")
        if isinstance(dom, dict):
            dom_id = dom.get("id")
            if dom_id not in THEMES:
                raise DailyThemesError(f"Unknown theme id {dom_id} for {date_str}")
            dom.update(THEMES[dom_id])
            info["dominant_theme"] = dom

        days.append({"date": date_str, **info})

    days.sort(key=lambda d: d["date"])

    return {
        "range_start": start.isoformat(),
        "range_end": end.isoformat(),
        "timezone": str(tz),
        "days": days,
    }
