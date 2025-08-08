
from typing import List, Dict, Any, Optional, Tuple
from collections import Counter
import re
import numpy as np
import pandas as pd
import datetime as dt
from parse import Message

AFFECTION_TOKENS = [
    "love you", "luv u", "miss you", "😘", "❤️", "❤", "💕", "💖", "babe", "baby", "hun", "honey",
    "cutie", "sweetheart", "pet", "proud of you"
]

PROFANITY = ["fuck", "shit", "bitch", "asshole", "dick", "cuck"]

PRONOUNS_WE = ["we", "us", "our", "ours"]
PRONOUNS_I = ["i", "me", "my", "mine"]

QUESTION_PAT = re.compile(r"\?\s*$|^\s*(who|what|when|where|why|how|can|do|did|are|is|should)\b", re.IGNORECASE)

def to_df(messages: List[Message]) -> pd.DataFrame:
    rows = []
    for i, m in enumerate(messages):
        rows.append({
            "i": i,
            "ts": m.ts,
            "sender": m.sender or "",
            "text": m.text or "",
            "has_media": m.has_media,
            "is_system": m.is_system,
            "n_words": len(m.text.split()) if m.text else 0,
            "n_chars": len(m.text) if m.text else 0,
        })
    return pd.DataFrame(rows)

def compute_reply_times(df: pd.DataFrame) -> pd.DataFrame:
    # Reply time is time from a message to the very next message by the other person
    df = df.sort_values("ts").reset_index(drop=True)
    reply_sec = []
    for idx in range(len(df) - 1):
        cur = df.iloc[idx]
        nxt = df.iloc[idx + 1]
        if cur["sender"] and nxt["sender"] and cur["sender"] != nxt["sender"]:
            delta = (nxt["ts"] - cur["ts"]).total_seconds()
            reply_sec.append({"from": cur["sender"], "to": nxt["sender"], "sec": max(delta, 0)})
    return pd.DataFrame(reply_sec)

def compute_kpis(df: pd.DataFrame) -> Dict[str, Any]:
    by_sender = df[~df["is_system"]].groupby("sender").agg(
        messages=("i","count"),
        words=("n_words","sum"),
        media=("has_media","sum"),
    ).reset_index()

    total_msgs = int(by_sender["messages"].sum()) if len(by_sender)>0 else 0
    total_words = int(by_sender["words"].sum()) if len(by_sender)>0 else 0

    # Reply times
    r = compute_reply_times(df[~df["is_system"]])
    reply_summary = None
    if not r.empty:
        reply_summary = r.groupby("to")["sec"].agg(["median","mean","max","count"]).reset_index()

    # Interruptions - consecutive runs by same sender
    df2 = df[~df["is_system"]].copy().sort_values("ts").reset_index(drop=True)
    runs = []
    if len(df2) > 0:
        cur_sender = df2.loc[0,"sender"]
        run_len = 1
        for idx in range(1, len(df2)):
            s = df2.loc[idx,"sender"]
            if s == cur_sender:
                run_len += 1
            else:
                runs.append({"sender": cur_sender, "len": run_len})
                cur_sender = s
                run_len = 1
        runs.append({"sender": cur_sender, "len": run_len})
    runs_df = pd.DataFrame(runs)
    interrupts = runs_df[runs_df["len"] >= 2].groupby("sender")["len"].agg(["count","max"]).reset_index() if not runs_df.empty else pd.DataFrame()

    # Questions and unanswered within 15 minutes
    df2["is_question"] = df2["text"].fillna("").str.contains(QUESTION_PAT)
    df2["next_ts"] = df2["ts"].shift(-1)
    df2["next_sender"] = df2["sender"].shift(-1)
    fifteen = pd.Timedelta(minutes=15)
    df2["answered_within_15m"] = (~df2["is_question"]) | (
        (df2["next_sender"] != df2["sender"]) & ((df2["next_ts"] - df2["ts"]) <= fifteen)
    )
    questions = int(df2["is_question"].sum())
    unanswered = int((df2["is_question"] & ~df2["answered_within_15m"]).sum())

    # Profanity rate
    prof_pat = re.compile("|".join([re.escape(w) for w in PROFANITY]), re.IGNORECASE)
    profanity_hits = int(df2["text"].str.contains(prof_pat, na=False).sum())

    # We-ness ratio
    def count_tokens(text: str, toks: List[str]) -> int:
        if not text:
            return 0
        txt = re.sub(r"[^a-zA-Z\s]", " ", text.lower())
        words = txt.split()
        return sum(1 for w in words if w in toks)
    we = int(df2["text"].fillna("").apply(lambda t: count_tokens(t, PRONOUNS_WE)).sum())
    i_tokens = int(df2["text"].fillna("").apply(lambda t: count_tokens(t, PRONOUNS_I)).sum())
    we_ratio = float(we / max(1, we + i_tokens))

    # Affection index (very simple v0)
    affection_hits = 0
    for tok in AFFECTION_TOKENS:
        affection_hits += int(df2["text"].str.contains(re.escape(tok), case=False, na=False).sum())

    out = {
        "by_sender": by_sender.to_dict(orient="records"),
        "totals": {"messages": total_msgs, "words": total_words},
        "reply_times_summary": reply_summary.to_dict(orient="records") if reply_summary is not None else [],
        "interruptions": interrupts.to_dict(orient="records") if not interrupts.empty else [],
        "questions": {"total": questions, "unanswered_15m": unanswered},
        "media_total": int(df2["has_media"].sum()),
        "profanity_hits": profanity_hits,
        "we_ness_ratio": we_ratio,
        "affection_hits": affection_hits,
    }
    return out
