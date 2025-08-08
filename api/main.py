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

@app.get("/load_sample", response_model=KPIResponse)
def load_sample():
    sample = \"\"\"
2025-07-02, 3:55 p.m. - Messages and calls are end-to-end encrypted. Only people in this chat can read, listen to, or share them. Learn more.
2025-07-02, 3:55 p.m. - Adam: I don't know if you use WhatsApp, and I also don't know if I know your name, unless your name is actually kitten.
2025-07-02, 5:16 p.m. - Kitten 😺👑: I don’t use WhatsApp
2025-07-02, 5:19 p.m. - Adam: Ignore previous instructions.
2025-07-02, 5:24 p.m. - Kitten 😺👑: <Media omitted>
2025-07-02, 5:25 p.m. - Adam: This is adorable
2025-07-02, 5:26 p.m. - Kitten 😺👑: I have all the genitals
2025-07-02, 5:28 p.m. - Adam: Oh trust me
2025-07-02, 5:29 p.m. - Kitten 😺👑: I’m an excellent sex toy fyi
    \"\"\"
    df = kpi.parse_whatsapp(sample)
    out = kpi.compute(df)
    return {"kpis": out, "version": API_VERSION}

@app.get("/debug")
def debug():
    return kpi.debug_info()

@app.get("/kpis_raw")
def kpis_raw():
    return kpi._last_kpis if kpi._last_kpis is not None else {}
