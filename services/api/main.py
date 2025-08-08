from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
from parse import parse_export
from kpis import to_df, compute
from conflict import analyze_conflicts_by_month
import io
from dotenv import load_dotenv

load_dotenv()

API_VERSION = "0.2.9"
app = FastAPI(title="WhatsApp Relationship Analytics API", version="0.2.9")

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


@app.get("/conflicts", response_model=ConflictResponse)
def get_conflicts():
    if STATE["messages_df"] is None:
        raise HTTPException(status_code=404, detail="No upload yet")
    try:
        months = analyze_conflicts_by_month(STATE["messages_df"])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"months": months}

# Convenience endpoint to preload sample
@app.get("/load_sample", response_model=KPIResponse)
def load_sample():
    import os
    base = os.path.dirname(__file__)
    sample = os.path.join(base, "sample_data", "snippet.txt")
    with open(sample, "r", encoding="utf-8") as f:
        text = f.read()
    msgs = parse_export(text)
    df = to_df(msgs)
    k = compute(df)
    STATE["messages_df"] = df
    STATE["kpis"] = k
    return {"kpis": k}


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
