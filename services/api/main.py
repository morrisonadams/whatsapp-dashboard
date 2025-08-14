from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import datetime as dt
from parse import parse_export, group_by_day, iterate_14day_ranges
from kpis import to_df, compute
from conflict import analyze_conflicts, stream_conflicts, periods_to_months
from daily_themes import analyze_range
import json
import os
from dotenv import load_dotenv

load_dotenv()

API_VERSION = "0.2.9"
app = FastAPI(title="WhatsApp Relationship Analytics API", version="0.2.9")

MAX_CONCURRENCY = int(os.getenv("CONFLICT_MAX_CONCURRENCY", 0)) or (os.cpu_count() or 10)

# Dev CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

STATE = {
    "messages_df": None,
    "messages": None,
    "kpis": None,
}

class KPIResponse(BaseModel):
    kpis: Dict[str, Any]


class ConflictMonth(BaseModel):
    month: str
    total_conflicts: int
    conflicts: List[Dict[str, str]]


class ConflictResponse(BaseModel):
    months: List[ConflictMonth]

@app.post("/upload", response_model=KPIResponse)
async def upload(file: UploadFile = File(...)):
    if not file.filename.endswith(".txt"):
        raise HTTPException(status_code=400, detail="Upload a .txt export")
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    msgs = parse_export(text)
    if not msgs:
        raise HTTPException(status_code=400, detail="No messages parsed")
    df = to_df(msgs)
    k = compute(df)
    STATE["messages_df"] = df
    STATE["messages"] = msgs
    STATE["kpis"] = k
    return {"kpis": k}

@app.get("/kpis", response_model=KPIResponse)
def get_kpis():
    if STATE["kpis"] is None:
        raise HTTPException(status_code=404, detail="No upload yet")
    return {"kpis": STATE["kpis"]}

@app.get("/messages")
def get_messages():
    if STATE["messages_df"] is None:
        raise HTTPException(status_code=404, detail="No upload yet")
    df = STATE["messages_df"]
    return {"messages": df.to_dict(orient="records")}


@app.get("/daily_themes")
async def get_daily_themes():
    """Return daily conversation themes for the uploaded chat."""
    if STATE["messages"] is None:
        raise HTTPException(status_code=404, detail="No upload yet")
    # Gracefully handle missing model credentials by returning an empty result
    if not os.getenv("OPENAI_API_KEY"):
        return {"range_start": None, "range_end": None, "timezone": "UTC", "days": []}
    try:
        daily = group_by_day(STATE["messages"], dt.timezone.utc)
        all_days: List[Dict[str, Any]] = []
        start: Optional[dt.date] = None
        end: Optional[dt.date] = None
        for range_start, range_end, msgs in iterate_14day_ranges(daily):
            res = analyze_range(range_start, range_end, msgs, dt.timezone.utc)
            all_days.extend(res.get("days", []))
            if start is None or range_start < start:
                start = range_start
            if end is None or range_end > end:
                end = range_end
        all_days.sort(key=lambda d: d.get("date", ""))
        return {
            "range_start": start.isoformat() if start else None,
            "range_end": end.isoformat() if end else None,
            "timezone": "UTC",
            "days": all_days,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/conflicts", response_model=ConflictResponse)
async def get_conflicts():
    if STATE["messages_df"] is None:
        raise HTTPException(status_code=404, detail="No upload yet")
    try:
        periods = await analyze_conflicts(
            STATE["messages_df"], max_concurrency=MAX_CONCURRENCY
        )
        months = periods_to_months(periods)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"months": months}

@app.get("/version")
def version():
    return {"version": API_VERSION}


@app.get("/debug")
def debug():
    if STATE["messages_df"] is None:
        return {"parsed": 0, "senders": {}, "note": "No upload yet"}
    df = STATE["messages_df"]
    senders = df[~df["is_system"]]["sender"].value_counts().to_dict()
    return {
        "parsed": int(len(df)),
        "non_system": int((~df["is_system"]).sum()),
        "senders": senders,
        "head": df.head(5).to_dict(orient="records")
    }


@app.get("/kpis_raw")
def kpis_raw():
    if STATE["kpis"] is None:
        return {}
    return STATE["kpis"]


@app.get("/health")
def health():
    return {"ok": True, "version": API_VERSION, "has_kpis": STATE["kpis"] is not None}


@app.get("/conflicts_stream")
async def conflicts_stream():
    if STATE["messages_df"] is None:
        raise HTTPException(status_code=404, detail="No upload yet")

    async def event_gen():
        async for current, total, data in stream_conflicts(
            STATE["messages_df"], max_concurrency=MAX_CONCURRENCY
        ):
            payload = {"current": current, "total": total, "period": data}
            yield f"data: {json.dumps(payload)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")
