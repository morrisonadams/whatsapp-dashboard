import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import pandas as pd

_last_df = None
_last_kpis: Optional[Dict[str, Any]] = None

TS_PAT = re.compile(
    r"^(\d{4}-\d{2}-\d{2}),\s+(\d{1,2}:\d{2})\s*(a\.m\.|p\.m\.)?\s+-\s+",
    flags=re.IGNORECASE,
)

NAME_SPLIT = re.compile(r"^\s*([^:]+):\s*(.*)$")

AFFECTION_TOKENS = [
    "love", "lovely", "babe", "baby", "dear", "kiss", "kisses", "xoxo", "sweetheart", "cutie", "❤️", "😍", "😘", "🥰", "💕", "💖"
]

QUESTION_PAT = re.compile(r"\?\s*$")

def _parse_ts(date_str: str, time_str: str, ampm: Optional[str]) -> datetime:
    fmt = "%Y-%m-%d %I:%M" if ampm else "%Y-%m-%d %H:%M"
    t = datetime.strptime(f"{date_str} {time_str}", fmt)
    if ampm:
        if ampm.lower().startswith("p") and t.hour < 12:
            t = t.replace(hour=t.hour + 12)
        if ampm.lower().startswith("a") and t.hour == 12:
            t = t.replace(hour=0)
    return t

def parse_whatsapp(text: str) -> pd.DataFrame:
    global _last_df
    lines = [l.rstrip("\n") for l in text.splitlines()]
    records: List[Dict[str, Any]] = []
    cur: Dict[str, Any] = {}
    for line in lines:
        m = TS_PAT.match(line)
        if m:
            if cur:
                records.append(cur)
            date_s, time_s, ampm = m.groups()
            rest = line[m.end():]
            sender = ""
            msg = rest
            nm = NAME_SPLIT.match(rest)
            if nm:
                sender = nm.group(1).strip()
                msg = nm.group(2)
            is_system = sender == "" and ":" not in rest
            cur = {
                "ts": _parse_ts(date_s, time_s, ampm),
                "sender": sender,
                "text": msg,
                "is_system": is_system,
            }
        else:
            if cur:
                cur["text"] += "\n" + line
    if cur:
        records.append(cur)

    df = pd.DataFrame(records)
    if df.empty:
        df = pd.DataFrame(columns=["ts","sender","text","is_system"])
    df["sender"] = df["sender"].fillna("")
    df["text"] = df["text"].fillna("")
    df["has_media"] = df["text"].str.contains("<Media omitted>", regex=False)
    df["n_words"] = df["text"].str.split().apply(len)
    df["day"] = df["ts"].dt.strftime("%Y-%m-%d")
    df["weekday"] = df["ts"].dt.weekday
    df["hour"] = df["ts"].dt.hour
    _last_df = df
    return df

def _participants(df: pd.DataFrame) -> List[str]:
    parts = [p for p in df["sender"].unique().tolist() if p]
    return parts[:2]

def _pair_replies(df: pd.DataFrame) -> pd.DataFrame:
    parts = _participants(df)
    if len(parts) < 2:
        return pd.DataFrame(columns=["from","to","dt_sec"])
    a, b = parts[0], parts[1]
    rows = []
    for i, row in df.iterrows():
        if row["sender"] not in parts or row["is_system"]:
            continue
        cur_sender = row["sender"]
        other = b if cur_sender == a else a
        nxt = df[(df.index > i) & (df["sender"] == other) & (~df["is_system"])]
        if not nxt.empty:
            dt = (nxt.iloc[0]["ts"] - row["ts"]).total_seconds()
            if dt >= 0:
                rows.append({"from": cur_sender, "to": other, "dt_sec": dt})
    return pd.DataFrame(rows)

def compute(df: pd.DataFrame) -> Dict[str, Any]:
    global _last_kpis
    if df is None or df.empty:
        _last_kpis = {"participants": [], "by_sender": [], "timeline_messages": [], "timeline_words": [], "reply_simple": []}
        return _last_kpis

    parts = _participants(df)

    agg = (
        df[~df["is_system"]]
        .groupby("sender")
        .agg(messages=("text", "count"), words=("n_words", "sum"))
        .reset_index()
        .to_dict(orient="records")
    )

    tm = (
        df[~df["is_system"]]
        .groupby(["day","sender"])
        .agg(messages=("text","count"), words=("n_words","sum"))
        .reset_index()
        .to_dict(orient="records")
    )
    timeline_messages = [{"day": r["day"], "sender": r["sender"], "messages": r["messages"]} for r in tm]
    timeline_words = [{"day": r["day"], "sender": r["sender"], "words": r["words"]} for r in tm]

    heat = (
        df[~df["is_system"]]
        .groupby(["sender","weekday","hour"])
        .size()
        .reset_index(name="count")
        .to_dict(orient="records")
    )

    pairs = _pair_replies(df)
    reply_simple = []
    for p in parts:
        v = pairs[pairs["to"] == p]["dt_sec"]
        reply_simple.append({"person": p, "median": float(v.median()) if len(v)>0 else 0.0, "mean": float(v.mean()) if len(v)>0 else 0.0})

    q = df[~df["is_system"] & df["text"].str.contains(r"\?\s*$", regex=True)]
    unanswered_total = 0
    unanswered_per = {p:0 for p in parts}
    for _, row in q.iterrows():
        sender = row["sender"]
        other = [x for x in parts if x != sender]
        if not other: 
            continue
        other = other[0]
        # 15-minute window
        window = df[(df["ts"] > row["ts"]) & (df["ts"] <= row["ts"] + timedelta(minutes=15)) & (df["sender"] == other) & (~df["is_system"])]
        if window.empty:
            unanswered_total += 1
            unanswered_per[sender] = unanswered_per.get(sender,0) + 1

    questions_total = int(len(q))
    questions_per = {p: int((q["sender"] == p).sum()) for p in parts}

    att = df[~df["is_system"] & df["has_media"]]
    attachments_total = int(len(att))
    attachments_per = {p: int((att["sender"] == p).sum()) for p in parts}

    aff = df[~df["is_system"]].copy()
    aff["aff"] = 0
    for tok in ["love","lovely","babe","baby","dear","kiss","kisses","xoxo","sweetheart","cutie","❤️","😍","😘","🥰","💕","💖"]:
        aff["aff"] = aff["aff"] | aff["text"].str.contains(tok, case=False, regex=False)
    affection_total = int(aff["aff"].sum())
    affection_per = {p: int(aff[aff["sender"]==p]["aff"].sum()) for p in parts}

    out = {
        "participants": parts,
        "by_sender": agg,
        "timeline_messages": timeline_messages,
        "timeline_words": timeline_words,
        "heatmap": heat,
        "reply_simple": reply_simple,
        "questions": {
            "total": questions_total,
            "unanswered_15m": unanswered_total,
            "per_person": questions_per,
            "unanswered_per_person": unanswered_per,
        },
        "attachments": {
            "total": attachments_total,
            "per_person": attachments_per
        },
        "affection": {
            "total": affection_total,
            "per_person": affection_per
        }
    }
    _last_kpis = out
    return out

def debug_info():
    if _last_df is None:
        return {"parsed": 0}
    return {
        "parsed": int(len(_last_df)),
        "non_system": int((~_last_df["is_system"]).sum()),
        "senders": _last_df[~_last_df["is_system"]]["sender"].value_counts().to_dict(),
        "head": _last_df.head(5).assign(ts=_last_df["ts"].astype(str)).to_dict(orient="records"),
    }
