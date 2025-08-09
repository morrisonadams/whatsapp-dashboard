import sys
from pathlib import Path

import asyncio
import pandas as pd

sys.path.append(str(Path(__file__).resolve().parents[2]))
from services.api import conflict


def test_cache_hit_skips_api(monkeypatch, tmp_path):
    df = pd.DataFrame(
        {
            "ts": pd.to_datetime(["2024-01-01", "2024-01-02"]),
            "text": ["Hello", "World"],
        }
    )
    cache_file = tmp_path / "cache.json"
    monkeypatch.setattr(conflict, "CACHE_FILE", cache_file)
    conflict._CACHE = {}
    conflict._load_cache()
    monkeypatch.setenv("OPENAI_API_KEY", "test")

    async def fake_analyze(period, sub, client, model, sem):
        return {"period": period, "total_conflicts": 0, "conflicts": []}

    monkeypatch.setattr(conflict, "_analyze_period_async", fake_analyze)
    first = asyncio.run(conflict.analyze_conflicts(df))

    # simulate fresh process by clearing in-memory cache and reloading from disk
    conflict._CACHE = {}
    conflict._load_cache()

    called = False

    async def should_not_call(*args, **kwargs):
        nonlocal called
        called = True
        return {"period": "p", "total_conflicts": 1, "conflicts": []}

    monkeypatch.setattr(conflict, "_analyze_period_async", should_not_call)
    second = asyncio.run(conflict.analyze_conflicts(df))

    assert first == second
    assert not called
