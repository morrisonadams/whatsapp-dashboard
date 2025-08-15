"""Utilities for theme constants and mood colors.

The module exposes a :data:`THEMES` mapping for the daily theme analysis.
Each theme is assigned an integer identifier, a human readable name and
an icon.
"""

from __future__ import annotations

from typing import Dict

THEMES: Dict[int, Dict[str, str]] = {
    0: {"name": "normal day", "icon": "🙂"},
    1: {"name": "emotional day", "icon": "😢"},
    2: {"name": "conflict day", "icon": "⚔️"},
    3: {"name": "exciting day", "icon": "🎉"},
}


_MOOD_COLORS = [
    "#ff0000",  # 0-9
    "#ff3300",  # 10-19
    "#ff6600",  # 20-29
    "#ff9900",  # 30-39
    "#ffcc00",  # 40-49
    "#ffff00",  # 50-59
    "#ccff00",  # 60-69
    "#99ff00",  # 70-79
    "#66ff00",  # 80-89
    "#33ff00",  # 90-100
]


def mood_to_color(percent: int) -> str:
    """Map a percentage value to a color in the mood scale.

    The scale uses ten evenly spaced buckets. Values outside ``0-100``
    are clamped to that range.
    """

    pct = max(0, min(100, int(percent)))
    idx = min(9, pct // 10)
    return _MOOD_COLORS[idx]
