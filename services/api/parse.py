import re, unicodedata
from collections import defaultdict
from dataclasses import dataclass
from typing import Dict, Iterator, List, Optional, Tuple
from dateutil import parser as dtparser
import datetime as dt

CONTROL_REMOVE = dict.fromkeys(
    map(
        ord,
        "\ufeff\u200e\u200f\u061c\u2066\u2067\u2068\u2069\u202a\u202b\u202c\u202d\u202e",
    ),
    None,
)


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
    s = s.replace("\u202f", " ").replace("\u00a0", " ").replace("\u2009", " ")
    s = s.replace("’", "'").replace("“", '"').replace("”", '"')
    return s


def parse_export(text: str, default_tz: dt.tzinfo = None) -> List[Message]:
    text = normalize_line(text)
    lines = text.splitlines()

    chunks, buf = [], []

    def flush():
        if buf:
            chunks.append("\n".join(buf).strip("\n"))
            buf.clear()

    for line in lines:
        if TS_RE.match(line):
            flush()
            buf.append(line)
        else:
            if not buf:
                continue
            buf.append(line)
    flush()

    msgs: List[Message] = []
    for chunk in chunks:
        first_line, *rest = chunk.split("\n")
        m = TS_RE.match(first_line)
        if not m:
            continue
        date_str, time_str, ampm, tail = m.groups()
        ts = dtparser.parse(
            f"{date_str} {time_str} {ampm.lower()}", dayfirst=False, yearfirst=True
        )
        if default_tz is not None and ts.tzinfo is None:
            ts = ts.replace(tzinfo=default_tz)

        sender, text, is_system, has_media = None, "", False, False
        if ":" in tail:
            sender, text = tail.split(":", 1)
            sender = sender.strip()
            text = text.strip()
        else:
            is_system = True
            text = tail.strip()

        if rest:
            text = (text + "\n" + "\n".join(rest)).strip()

        if "<Media omitted" in text:
            has_media = True

        msgs.append(
            Message(
                ts=ts,
                sender=sender,
                text=text,
                has_media=has_media,
                is_system=is_system,
            )
        )
    return msgs


def group_by_day(
    messages: List[Message], tz: dt.tzinfo
) -> Dict[dt.date, List[Message]]:
    """Group messages by day in the given timezone.

    Parameters
    ----------
    messages: List[Message]
        Messages to group.
    tz: datetime.tzinfo
        Timezone used to interpret the message timestamps.

    Returns
    -------
    Dict[datetime.date, List[Message]]
        Mapping from date to messages sent on that date.
    """

    days: Dict[dt.date, List[Message]] = defaultdict(list)
    for msg in messages:
        ts = msg.ts
        if tz is not None:
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=tz)
            else:
                ts = ts.astimezone(tz)
        days[ts.date()].append(msg)
    return dict(days)


def iterate_14day_ranges(
    daily_messages: Dict[dt.date, List[Message]],
) -> Iterator[Tuple[dt.date, dt.date, List[Message]]]:
    """Iterate over non-overlapping 14-day ranges of messages.

    Parameters
    ----------
    daily_messages: Dict[date, List[Message]]
        Mapping of dates to messages for that day.

    Yields
    ------
    Tuple[date, date, List[Message]]
        The start date, end date (inclusive) and list of messages for the
        14-day period.
    """

    if not daily_messages:
        return

    sorted_days = sorted(daily_messages.keys())
    start = sorted_days[0]
    last = sorted_days[-1]

    current = start
    while current <= last:
        end = min(current + dt.timedelta(days=13), last)
        msgs: List[Message] = []
        day = current
        while day <= end:
            msgs.extend(daily_messages.get(day, []))
            day += dt.timedelta(days=1)
        yield current, end, msgs
        current = end + dt.timedelta(days=1)
