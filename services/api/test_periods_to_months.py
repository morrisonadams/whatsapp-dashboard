import pytest

from services.api.conflict import periods_to_months

def test_periods_to_months_groups_by_conflict_date_and_sorts():
    periods = [
        {
            "period": "2024-01-15/2024-01-28",
            "conflicts": [
                {"date": "2024-02-05", "summary": "later"},
                {"date": "2024-02-01", "summary": "earlier"},
            ],
        },
        {
            "period": "2024-01-29/2024-02-11",
            "conflicts": [
                {"date": "2024-01-30", "summary": "jan"},
            ],
        },
    ]
    months = periods_to_months(periods)
    assert [m["month"] for m in months] == ["2024-01", "2024-02"]
    assert [c["date"] for c in months[0]["conflicts"]] == ["2024-01-30"]
    assert [c["date"] for c in months[1]["conflicts"]] == ["2024-02-01", "2024-02-05"]
    assert [m["total_conflicts"] for m in months] == [1, 2]
