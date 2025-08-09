import sys
from pathlib import Path

import asyncio
import pandas as pd

sys.path.append(str(Path(__file__).resolve().parents[2]))
from services.api import conflict  # noqa: E402


async def _dummy_analyze(period, sub, client, model, sem):
    return {"period": period, "total_conflicts": 0, "conflicts": []}


def _dummy_groups(df):
    return {"p": df}


def _make_df():
    return pd.DataFrame({"ts": pd.to_datetime(["2024-01-01"]), "text": ["hi"]})


def test_analyze_conflicts_uses_default_concurrency(monkeypatch):
    df = _make_df()
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setattr(conflict, "_fortnight_groups", _dummy_groups)
    monkeypatch.setattr(conflict, "_analyze_with_cache", _dummy_analyze)
    monkeypatch.setattr(conflict, "DEFAULT_MAX_CONCURRENCY", 7)

    recorded = {}

    class DummySem:
        def __init__(self, value):
            recorded["value"] = value

    monkeypatch.setattr(asyncio, "Semaphore", DummySem)

    asyncio.run(conflict.analyze_conflicts(df))

    assert recorded["value"] == 7


def test_stream_conflicts_respects_parameter(monkeypatch):
    df = _make_df()
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setattr(conflict, "_fortnight_groups", _dummy_groups)
    monkeypatch.setattr(conflict, "_analyze_with_cache", _dummy_analyze)

    recorded = {}

    class DummySem:
        def __init__(self, value):
            recorded["value"] = value

    monkeypatch.setattr(asyncio, "Semaphore", DummySem)

    async def run():
        async for _ in conflict.stream_conflicts(df, max_concurrency=3):
            pass

    asyncio.run(run())

    assert recorded["value"] == 3
