from fastapi import FastAPI, UploadFile, File, HTTPException, Query
import datetime as dt
from zoneinfo import ZoneInfo
from typing import Optional, List
import os

from services.api import parse
from services.api.daily_themes import analyze_ranges
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import kpis as kpi

API_VERSION = "0.3.4"

app = FastAPI(title="WhatsApp Relationship Analytics", version=API_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class KPIResponse(BaseModel):
    kpis: Dict[str, Any]
    version: str

@app.get("/version")
def version():
    return {"version": API_VERSION}

@app.post("/upload", response_model=KPIResponse)
async def upload(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    df = kpi.parse_whatsapp(text)
    out = kpi.compute(df)
    return {"kpis": out, "version": API_VERSION}

@app.get("/debug")
def debug():
    return kpi.debug_info()

@app.get("/kpis_raw")
def kpis_raw():
    return kpi._last_kpis if kpi._last_kpis is not None else {}


@app.post("/daily_themes")
async def daily_themes(
    file: UploadFile = File(...),
    timezone: str = Query(..., alias="timezone"),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
):
    """Analyze daily conversation themes in 14-day windows."""

    try:
        tz = ZoneInfo(timezone)
    except Exception as exc:  # pragma: no cover - invalid timezone
        raise HTTPException(status_code=400, detail="Invalid timezone") from exc

    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    msgs = parse.parse_export(text, tz)

    daily = parse.group_by_day(msgs, tz)

    if not os.getenv("OPENAI_API_KEY"):
        return {
            "range_start": None,
            "range_end": None,
            "timezone": str(tz),
            "days": [],
            "error": "OpenAI API key not set",
        }

    # Apply optional date filters
    if start:
        start_date = dt.date.fromisoformat(start)
    else:
        start_date = min(daily.keys()) if daily else None
    if end:
        end_date = dt.date.fromisoformat(end)
    else:
        end_date = max(daily.keys()) if daily else None

    if start_date or end_date:
        filtered: Dict[dt.date, List[parse.Message]] = {}
        for day, items in daily.items():
            if start_date and day < start_date:
                continue
            if end_date and day > end_date:
                continue
            filtered[day] = items
        daily = filtered

    if not daily:
        raise HTTPException(status_code=400, detail="No messages in range")

    ranges = list(parse.iterate_14day_ranges(daily))
    results = await analyze_ranges(ranges, tz)

    all_days: List[Dict[str, Any]] = []
    global_start: Optional[dt.date] = None
    global_end: Optional[dt.date] = None

    for res in results:
        all_days.extend(res.get("days", []))
        rs = res.get("range_start")
        re = res.get("range_end")
        if rs:
            rs_date = dt.date.fromisoformat(rs)
            if global_start is None or rs_date < global_start:
                global_start = rs_date
        if re:
            re_date = dt.date.fromisoformat(re)
            if global_end is None or re_date > global_end:
                global_end = re_date

    all_days.sort(key=lambda d: d.get("date", ""))

    return {
        "range_start": global_start.isoformat() if global_start else None,
        "range_end": global_end.isoformat() if global_end else None,
        "timezone": str(tz),
        "days": all_days,
    }
