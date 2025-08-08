
import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from io import StringIO
from parse import parse_export
from kpis import to_df, compute_kpis

st.set_page_config(page_title="WhatsApp Relationship Analytics", layout="wide")
st.title("WhatsApp Relationship Analytics - v0.1")

st.write("Upload a WhatsApp .txt export to analyze. A sample is loaded below.")

sample_path = "sample_data/snippet.txt"
with open(sample_path, "r", encoding="utf-8") as f:
    sample_text = f.read()

uploaded = st.file_uploader("Upload WhatsApp export (.txt)", type=["txt"], accept_multiple_files=False)

if uploaded:
    text = uploaded.read().decode("utf-8", errors="ignore")
else:
    with st.expander("View sample input", expanded=False):
        st.code(sample_text, language="text")
    text = sample_text

msgs = parse_export(text)
df = to_df(msgs)

if df.empty:
    st.warning("No messages parsed. Check the file format.")
    st.stop()

# Overview
kpis = compute_kpis(df)

c1, c2, c3, c4 = st.columns(4)
c1.metric("Messages", kpis["totals"]["messages"])
c2.metric("Words", kpis["totals"]["words"])
c3.metric("Media attachments", kpis["media_total"])
c4.metric("Profanity hits", kpis["profanity_hits"])

st.subheader("By sender")
st.dataframe(pd.DataFrame(kpis["by_sender"]))

st.subheader("Reply times summary (seconds, by recipient)")
st.dataframe(pd.DataFrame(kpis["reply_times_summary"]))


# Timeline - messages over time
st.subheader("Timeline")
df_day = df[~df["is_system"]].copy()
df_day["day"] = df_day["ts"].dt.floor("D")
by_day = df_day.groupby(["day","sender"]).size().reset_index(name="messages")
if not by_day.empty:
    fig = plt.figure()
    for sender in by_day["sender"].unique():
        sub = by_day[by_day["sender"] == sender]
        plt.plot(sub["day"], sub["messages"], marker="o", label=sender)
    plt.xlabel("Day")
    plt.ylabel("Messages")
    plt.legend()
    st.pyplot(fig)

# Questions
st.subheader("Questions within 15 minutes window")
q_total = kpis["questions"]["total"]
q_un = kpis["questions"]["unanswered_15m"]
st.write(f"Questions: {q_total} - Unanswered within 15 minutes: {q_un}")

# Drill - transcript preview
st.subheader("Transcript")
st.dataframe(df[["ts","sender","text","has_media"]])

st.caption("v0.1 - single container. Minimal KPIs to validate the idea.")
