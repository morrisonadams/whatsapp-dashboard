from fastapi import FastAPI, UploadFile, File
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
