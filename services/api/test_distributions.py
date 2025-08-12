import pytest
from parse import parse_export
from kpis import to_df, compute

sample_chat = """2024-01-01, 9:00 a.m. - Alice: hi
2024-01-01, 9:01 a.m. - Bob: hey there
2024-01-01, 9:02 a.m. - Alice: how are you?
2024-01-01, 9:05 a.m. - Bob: good"""

def test_words_and_reply_distributions():
    msgs = parse_export(sample_chat)
    df = to_df(msgs)
    k = compute(df)
    assert k["words_per_message"]["Alice"] == [1, 3]
    assert k["words_per_message"]["Bob"] == [2, 1]
    assert sorted(k["reply_times"]["Bob"]) == [60.0, 180.0]
    assert sorted(k["reply_times"]["Alice"]) == [60.0]
