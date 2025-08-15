import datetime as dt
import pytest

from daily_themes import parse_days_json, DailyThemesError, analyze_range, Message
from themes import THEMES, mood_to_color


valid_json = (
    """
    {
      "2024-01-02": {"mood": 75, "color_hex": "#fff", "dominant_theme": {"id": 2}},
      "2024-01-01": {"mood": 20, "color_hex": "#000", "dominant_theme": {"id": 4}}
    }
    """.strip()
)


def test_parse_days_json_normalizes_and_sorts():
    start = dt.date(2024, 1, 1)
    end = dt.date(2024, 1, 2)
    tz = dt.timezone.utc
    out = parse_days_json(valid_json, start, end, tz)
    assert out["range_start"] == "2024-01-01"
    assert out["range_end"] == "2024-01-02"
    assert out["timezone"] == "UTC"
    dates = [d["date"] for d in out["days"]]
    assert dates == ["2024-01-01", "2024-01-02"]
    first, second = out["days"]
    assert first["color_hex"] == mood_to_color(20)
    assert second["color_hex"] == mood_to_color(75)
    assert first["dominant_theme"]["name"] == THEMES[4]["name"]
    assert second["dominant_theme"]["icon"] == THEMES[2]["icon"]


def test_parse_days_json_bad_json_raises():
    with pytest.raises(DailyThemesError):
        parse_days_json('{bad json', dt.date(2024, 1, 1), dt.date(2024, 1, 2), dt.timezone.utc)


def test_parse_days_json_unknown_theme():
    bad_theme_json = '{"2024-01-01": {"mood": 10, "dominant_theme": {"id": 99}}}'
    with pytest.raises(DailyThemesError):
        parse_days_json(bad_theme_json, dt.date(2024, 1, 1), dt.date(2024, 1, 1), dt.timezone.utc)


def test_analyze_range_returns_empty_on_bad_json(monkeypatch):
    """analyze_range should not raise even if the model output is invalid."""

    class DummyResp:
        output_text = "not json"

    class DummyClient:
        def __init__(self, api_key: str):
            pass

        class _Responses:
            def create(self, **kwargs):
                return DummyResp()

        @property
        def responses(self):
            return self._Responses()

    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setattr("daily_themes.OpenAI", lambda api_key: DummyClient(api_key))

    msg = Message(ts=dt.datetime(2024, 1, 1, tzinfo=dt.timezone.utc), sender="A", text="hi")
    out = analyze_range(dt.date(2024, 1, 1), dt.date(2024, 1, 14), [msg], dt.timezone.utc)
    assert out["days"] == []


def test_daily_themes_stream_initial_progress(monkeypatch):
    from main import app, STATE
    from parse import Message
    from fastapi.testclient import TestClient

    monkeypatch.setenv("OPENAI_API_KEY", "test")
    # Stub out analyze_range to avoid external calls
    monkeypatch.setattr(
        "main.analyze_range",
        lambda *args, **kwargs: {
            "range_start": "2024-01-01",
            "range_end": "2024-01-01",
            "timezone": "UTC",
            "days": [],
        },
    )

    STATE["messages"] = [
        Message(ts=dt.datetime(2024, 1, 1, tzinfo=dt.timezone.utc), sender="A", text="hi")
    ]
    client = TestClient(app)
    with client.stream("GET", "/daily_themes_stream") as r:
        events = [line for line in r.iter_lines() if line]

    assert events[0] == 'data: {"current": 0, "total": 1}'
    assert events[-1] == "data: [DONE]"
