
import re
import unicodedata
from dataclasses import dataclass
from typing import List, Optional, Dict, Tuple
from dateutil import parser as dtparser
import datetime as dt

CONTROL_REMOVE = dict.fromkeys(map(ord, "\ufeff\u200e\u200f\u061C\u2066\u2067\u2068\u2069\u202A\u202B\u202C\u202D\u202E"), None)

@dataclass
class Message:
    ts: dt.datetime
    sender: Optional[str]
    text: str
    has_media: bool = False
    is_system: bool = False

TS_RE = re.compile(
    r"^\s*(\d{4}-\d{2}-\d{2}),\s*(\d{1,2}:\d{2})\s*([ap]\.m\.)\s*-\s*(.*)$",
    re.IGNORECASE,
)

def normalize_line(s: str) -> str:
    if not isinstance(s, str):
        return s
    s = s.translate(CONTROL_REMOVE or {})
    s = unicodedata.normalize("NFKC", s)
    # Collapse various spaces to normal space
    s = s.replace("\u202f", " ").replace("\u00a0", " ").replace("\u2009", " ").replace("\u202f", " ")
    # Normalize smart quotes
    s = s.replace("’", "'").replace("“","\"").replace("”","\"")
    return s

def parse_export(text: str, default_tz: dt.tzinfo = None) -> List[Message]:
    text = normalize_line(text)
    lines = text.splitlines()

    # Join continuation lines until next timestamp pattern
    chunks: List[str] = []
    buf: List[str] = []
    def flush():
        if buf:
            chunks.append("\n".join(buf).strip("\n"))
            buf.clear()

    for line in lines:
        if TS_RE.match(line):
            flush()
            buf.append(line)
        else:
            # continuation or blank
            if not buf:
                # ignore stray preamble lines
                continue
            buf.append(line)
    flush()

    msgs: List[Message] = []
    for chunk in chunks:
        first_line, *rest = chunk.split("\n")
        m = TS_RE.match(first_line)
        if not m:
            # Should not happen
            continue
        date_str, time_str, ampm, tail = m.groups()
        ts_str = f"{date_str} {time_str} {ampm.lower()}"
        ts = dtparser.parse(ts_str, dayfirst=False, yearfirst=True)
        if default_tz is not None and ts.tzinfo is None:
            ts = ts.replace(tzinfo=default_tz)

        sender = None
        text = ""
        is_system = False
        has_media = False

        if ":" in tail:
            sender, text = tail.split(":", 1)
            sender = sender.strip()
            text = text.strip()
        else:
            # system message like "Messages and calls are end-to-end encrypted..."
            is_system = True
            text = tail.strip()

        # Append continuation lines to text
        if rest:
            text = (text + "\n" + "\n".join(rest)).strip()

        if "<Media omitted>" in text or "<Media omitted" in text:
            has_media = True

        msgs.append(Message(ts=ts, sender=sender, text=text, has_media=has_media, is_system=is_system))
    return msgs
