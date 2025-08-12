from typing import List, Dict, Any, Set
import re, pandas as pd
from collections import Counter
from wordcloud import STOPWORDS as WC_STOPWORDS
from parse import Message
import emoji

AFFECTION_TOKENS = [
    "love you","luv u","miss you","😘","❤️","❤","💕","💖",
    "babe","baby","hun","honey","cutie","sweetheart","proud of you"
]
PROFANITY = [
    "fuck","shit","bitch","ass","asshole","dick","cuck","bastard",
    "damn","crap","hell","piss","motherfucker","bullshit"
]
SEXUAL_WORDS = [
    "sex","sexy","naked","nude","dick","pussy","boobs","tits","cock","cum",
    "horny","ass","booty","butt","lingerie","thighs","kinky","seduce"
]
SPACE_WORDS = [
    "space","rocket","planet","star","galaxy","universe","moon",
    "mars","astronaut","cosmos","nebula","nasa"
]
PRONOUNS_WE = ["we","us","our","ours"]
PRONOUNS_I = ["i","me","my","mine"]
QUESTION_PAT = re.compile(r"\?\s*$|^\s*(?:who|what|when|where|why|how|can|do|did|are|is|should)\b", re.IGNORECASE)

# Start with wordcloud's default stopwords and extend with chat-specific ones
STOPWORDS = set(WC_STOPWORDS)
STOPWORDS.update({"im", "us", "our", "ours", "your"})

def count_tokens(text: str, toks: List[str]) -> int:
    if not text:
        return 0
    txt = re.sub(r"[^a-zA-Z\s]", " ", text.lower())
    words = txt.split()
    return sum(1 for w in words if w in toks)

def word_counts(df: pd.DataFrame, participants: List[str], top_n: int = 50) -> Dict[str, List[Dict[str, Any]]]:
    out: Dict[str, List[Dict[str, Any]]] = {}
    filtered = df[
        df["sender"].isin(participants)
        & (~df["has_media"])
        & (~df["text"].str.contains("<media omitted>", case=False, na=False))
    ]
    for sender, sub in filtered.groupby("sender"):
        words: List[str] = []
        tags: Dict[str, Set[str]] = {}
        for text in sub["text"].fillna(""):
            tokens = re.findall(r"[A-Za-z']+", text.lower())
            emoji_tokens = [d["emoji"] for d in emoji.emoji_list(text)]
            for w in tokens:
                if w in STOPWORDS:
                    continue
                words.append(w)
                if w not in tags:
                    tags[w] = set()
                if w in PROFANITY:
                    tags[w].add("swear")
                if w in SEXUAL_WORDS:
                    tags[w].add("sexual")
                if w in SPACE_WORDS:
                    tags[w].add("space")
            for e in emoji_tokens:
                words.append(e)
                if e not in tags:
                    tags[e] = set()
                tags[e].add("emoji")
        cnt = Counter(words)

        # start with overall top N
        top_words = {w for w, _ in cnt.most_common(top_n)}
        # ensure we also include top N for each tag category
        all_tags = {t for ts in tags.values() for t in ts}
        for t in all_tags:
            tagged = [w for w in cnt if t in tags.get(w, set())]
            top_words.update(
                [w for w, _ in Counter({w: cnt[w] for w in tagged}).most_common(top_n)]
            )
        out[str(sender)] = [
            {"name": w, "value": int(cnt[w]), "tags": sorted(list(tags.get(w, set())))}
            for w in sorted(top_words, key=lambda x: cnt[x], reverse=True)
        ]
    return out

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
    df = pd.DataFrame(rows).sort_values("ts").reset_index(drop=True)
    return df

def reply_pairs(df: pd.DataFrame) -> pd.DataFrame:
    """Run-based pairing: for each streak of messages from the same sender,
    pair the *first* message in that streak with the next message from a
    different sender. This ensures response time measures from the start of
    a message run rather than the last message before a reply."""
    if len(df) == 0:
        return pd.DataFrame()

    # Ignore rows without a sender to avoid creating spurious runs
    d = df[df["sender"].astype(bool)].reset_index(drop=True)

    # Identify the first message of each run where the sender changes
    run_starts = d[d["sender"].ne(d["sender"].shift())].reset_index(drop=True)

    pairs = []
    for idx in range(len(run_starts) - 1):
        cur = run_starts.iloc[idx]
        nxt = run_starts.iloc[idx + 1]
        if cur["sender"] != nxt["sender"]:
            pairs.append({
                "from": cur["sender"],
                "to": nxt["sender"],
                "sec": (nxt["ts"] - cur["ts"]).total_seconds(),
            })
    return pd.DataFrame(pairs)

def reply_pairs_general(df: pd.DataFrame) -> pd.DataFrame:
    """For each message, find the next message by a *different* sender (not just adjacent)."""
    pairs = []
    n = len(df)
    for i in range(n - 1):
        cur = df.iloc[i]
        cur_sender = cur["sender"]
        j = i + 1
        while j < n and df.iloc[j]["sender"] == cur_sender:
            j += 1
        if j >= n:
            break
        nxt = df.iloc[j]
        delta = (nxt["ts"] - cur["ts"]).total_seconds()
        if delta >= 0:
            pairs.append({"initiator": cur_sender, "responder": nxt["sender"], "sec": float(delta)})
    return pd.DataFrame(pairs)

def interruptions(df: pd.DataFrame) -> pd.DataFrame:
    runs = []
    if len(df) == 0:
        return pd.DataFrame()
    df = df.reset_index(drop=True)
    cur_sender = df.iloc[0]["sender"]
    run_len = 1
    for idx in range(1, len(df)):
        s = df.iloc[idx]["sender"]
        if s == cur_sender:
            run_len += 1
        else:
            runs.append({"sender": cur_sender, "len": run_len})
            cur_sender = s
            run_len = 1
    runs.append({"sender": cur_sender, "len": run_len})
    return pd.DataFrame(runs)

def heatmap_hour_weekday(df: pd.DataFrame) -> pd.DataFrame:
    d = df[~df["is_system"]].copy()
    d["hour"] = d["ts"].dt.hour
    d["weekday"] = d["ts"].dt.weekday
    return d.groupby(["weekday","hour","sender"]).size().reset_index(name="count")

def we_ness(df: pd.DataFrame) -> float:
    we = int(df["text"].fillna("").apply(lambda t: count_tokens(t, PRONOUNS_WE)).sum())
    i_tokens = int(df["text"].fillna("").apply(lambda t: count_tokens(t, PRONOUNS_I)).sum())
    return float(we / max(1, we + i_tokens))

def affection_hits(df: pd.DataFrame) -> int:
    hits = 0
    for tok in AFFECTION_TOKENS:
        hits += int(df["text"].str.contains(re.escape(tok), case=False, na=False).sum())
    return hits

def profanity_hits(df: pd.DataFrame) -> int:
    if len(PROFANITY)==0: return 0
    pat = re.compile("|".join(re.escape(w) for w in PROFANITY), re.IGNORECASE)
    return int(df["text"].str.contains(pat, na=False).sum())

def compute(df: pd.DataFrame) -> Dict[str, Any]:
    d = df[~df["is_system"]].copy().reset_index(drop=True)
    # Coerce timestamps to pandas datetime, drop NaT, and sort
    d["ts"] = pd.to_datetime(d["ts"], errors="coerce")
    d = d.dropna(subset=["ts"]).sort_values("ts").reset_index(drop=True)

    participants = list(d["sender"].dropna().unique())

    by_sender_df = d.groupby("sender").agg(
        messages=("i","count"),
        words=("n_words","sum"),
        media=("has_media","sum")
    ).reset_index()

    totals = {
        "messages": int(by_sender_df["messages"].sum()) if len(by_sender_df)>0 else 0,
        "words": int(by_sender_df["words"].sum()) if len(by_sender_df)>0 else 0
    }

    # Words per message distribution per participant
    words_per_message = {
        str(p): d[d["sender"] == p]["n_words"].astype(int).tolist()
        for p in participants
    }

    # Reply stats (first message in each run versus next sender)
    rp = reply_pairs(d)
    reply_simple = []
    reply_times = {str(p): [] for p in participants}
    if not rp.empty:
        for person, arr in rp.groupby("to")["sec"]:
            arr = arr.clip(lower=0)
            reply_times[str(person)] = arr.astype(float).tolist()
            reply_simple.append({
                "person": str(person),
                "seconds": float(arr.mean()),
                "n": int(arr.size),
            })
    # ensure all participants present
    present = {r["person"] for r in reply_simple}
    for p in participants:
        if str(p) not in present:
            reply_simple.append({"person": str(p), "seconds": 0.0, "n": 0})

    # Interruptions
    runs_df = interruptions(d)
    interrupts = runs_df[runs_df["len"]>=2].groupby("sender")["len"].agg(["count","max"]).reset_index() if not runs_df.empty else pd.DataFrame()

    # Questions and unanswered within 15 minutes
    d["is_question"] = d["text"].fillna("").str.contains(QUESTION_PAT)
    d["next_ts"] = d["ts"].shift(-1)
    d["next_sender"] = d["sender"].shift(-1)
    fifteen = pd.Timedelta(minutes=15)
    d["answered_15m"] = (~d["is_question"]) | ((d["next_sender"] != d["sender"]) & ((d["next_ts"] - d["ts"]) <= fifteen))
    questions_total = int(d["is_question"].sum())
    unanswered_total = int((d["is_question"] & ~d["answered_15m"]).sum())

    q_counts = d.groupby("sender")["is_question"].sum().astype(int) if len(d)>0 else pd.Series(dtype=int)
    tmp = d[d["is_question"]].copy()
    un_counts = tmp.groupby("sender").apply(lambda g: (~g["answered_15m"]).sum()).astype(int) if len(tmp)>0 else pd.Series(dtype=int)
    q_split = [{"sender": p, "questions": int(q_counts.get(p,0)), "unanswered_15m": int(un_counts.get(p,0))} for p in participants]

    # Profanity + we-ness + affection
    if PROFANITY:
        prof_pat = re.compile("|".join(re.escape(w) for w in PROFANITY), re.IGNORECASE)
        d["is_profanity"] = d["text"].str.contains(prof_pat, na=False)
    else:
        d["is_profanity"] = False
    prof_total = int(d["is_profanity"].sum())

    if AFFECTION_TOKENS:
        aff_pat = re.compile("|".join(re.escape(tok) for tok in AFFECTION_TOKENS), re.IGNORECASE)
        d["is_affection"] = d["text"].str.contains(aff_pat, na=False)
    else:
        d["is_affection"] = False
    aff_counts = d.groupby("sender")["is_affection"].sum().astype(int) if len(d)>0 else pd.Series(dtype=int)
    aff_split = [{"sender": p, "affection": int(aff_counts.get(p,0))} for p in participants]
    aff_total = int(aff_counts.sum())

    we_ratio = we_ness(d)

    # Timeline strings
    if len(d)>0:
        day = d.copy()
        day["day"] = day["ts"].dt.strftime("%Y-%m-%d")
        day["we"] = day["text"].fillna("").apply(lambda t: count_tokens(t, PRONOUNS_WE))
        day["i"] = day["text"].fillna("").apply(lambda t: count_tokens(t, PRONOUNS_I))
        timeline_messages_df = day.groupby(["day","sender"]).size().reset_index(name="messages")
        timeline_words_df = day.groupby(["day","sender"])["n_words"].sum().reset_index(name="words")
        timeline_questions_df = day.groupby(["day","sender"])["is_question"].sum().reset_index(name="questions")
        timeline_media_df = day.groupby(["day","sender"])["has_media"].sum().reset_index(name="media")
        timeline_affection_df = day.groupby(["day","sender"])["is_affection"].sum().reset_index(name="affection")
        timeline_profanity_df = day.groupby(["day","sender"])["is_profanity"].sum().reset_index(name="profanity")
        timeline_we_df = day.groupby(["day","sender"])[["we","i"]].sum().reset_index()
    else:
        timeline_messages_df = pd.DataFrame(columns=["day","sender","messages"])
        timeline_words_df = pd.DataFrame(columns=["day","sender","words"])
        timeline_questions_df = pd.DataFrame(columns=["day","sender","questions"])
        timeline_media_df = pd.DataFrame(columns=["day","sender","media"])
        timeline_affection_df = pd.DataFrame(columns=["day","sender","affection"])
        timeline_profanity_df = pd.DataFrame(columns=["day","sender","profanity"])
        timeline_we_df = pd.DataFrame(columns=["day","sender","we","i"])

    # Heatmap
    heat_df = heatmap_hour_weekday(d) if len(d)>0 else pd.DataFrame(columns=["weekday","hour","sender","count"])

    word_cloud = word_counts(d, participants) if len(d)>0 else {}

    payload = {
        "participants": participants,
        "by_sender": by_sender_df.to_dict(orient="records"),
        "totals": totals,
        "reply_simple": reply_simple,
        "words_per_message": words_per_message,
        "reply_times": reply_times,
        "interruptions": interrupts.to_dict(orient="records"),
        "questions": {"total": questions_total, "unanswered_15m": unanswered_total},
        "questions_split": q_split,
        "media_total": int(d["has_media"].sum()) if len(d)>0 else 0,
        "profanity_hits": prof_total,
        "we_ness_ratio": we_ratio,
        "affection_hits": aff_total,
        "affection_split": aff_split,
        "timeline_messages": timeline_messages_df.to_dict(orient="records"),
        "timeline_words": timeline_words_df.to_dict(orient="records"),
        "timeline_questions": timeline_questions_df.to_dict(orient="records"),
        "timeline_media": timeline_media_df.to_dict(orient="records"),
        "timeline_affection": timeline_affection_df.to_dict(orient="records"),
        "timeline_profanity": timeline_profanity_df.to_dict(orient="records"),
        "timeline_we_ness": timeline_we_df.to_dict(orient="records"),
        "heatmap": heat_df.to_dict(orient="records"),
        "word_cloud": word_cloud
    }
    # legacy mirrors for compatibility
    payload["timeline"] = payload["timeline_messages"]
    payload["reply_times_summary"] = [{"to": r["person"], "seconds": r["seconds"], "count": r["n"]} for r in reply_simple]
    return payload
