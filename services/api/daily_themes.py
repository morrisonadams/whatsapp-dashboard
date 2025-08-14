from __future__ import annotations

import datetime as dt
import json
import os
from typing import Any, Dict, List

from openai import OpenAI

from parse import Message

PROMPT_TEMPLATE = (
    "You are an assistant categorizing daily conversation themes.\n"
    "Given the chat transcript between {date_range} in timezone {timezone},\n"
    "analyze each day's messages and label the prevailing theme using the\n"
    "following categories: conflict, repair, affection, humor, logistics,\n"
    "support, celebration, planning, question, other.\n"
    "Return a JSON object mapping each date to an array of detected themes.\n"
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
    resp = client.responses.create(
        model="gpt-5-nano", input=prompt, response_format={"type": "json_object"}
    )
    content = (resp.output_text or "").strip()
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        data = {}
    return data
