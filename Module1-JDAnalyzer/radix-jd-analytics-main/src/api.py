"""
FastAPI Microservice for Role 1: JD Analytics.
Provides REST endpoints for extracting skills from uploaded JD files or text payloads.
"""

import os
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .schema import JDExtractionOutput
from .extractor import JDExtractor
from .document_parser import parse_jd_file

app = FastAPI(
    title="RADIX Talent Match - JD Analytics API (Role 1)",
    description="Extracts structured skills according to the RADIX 12-skillset framework.",
    version="1.0.0"
)

# Enable CORS for team frontend integration (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

extractor = JDExtractor()


class TextExtractRequest(BaseModel):
    jd_text: str
    source_file: Optional[str] = "input_jd.txt"
    company: Optional[str] = None
    role: Optional[str] = None


@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "RADIX JD Analytics (Role 1)",
        "provider": extractor.provider
    }


@app.post("/api/extract-jd", response_model=JDExtractionOutput)
async def extract_from_file_upload(
    file: UploadFile = File(...),
    company: Optional[str] = Form(None),
    role: Optional[str] = Form(None)
):
    """
    Accepts a multipart file upload (PDF, DOCX, or TXT), extracts skills,
    and returns the standard RADIX JDExtractionOutput schema.
    """
    temp_dir = os.path.join(os.getcwd(), "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)

    try:
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        output = extractor.extract_from_file(
            file_path=temp_path,
            company=company,
            role=role
        )
        # Ensure source_file reflects original upload filename
        output.source_file = file.filename
        return output
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/api/extract-jd-text", response_model=JDExtractionOutput)
def extract_from_raw_text(payload: TextExtractRequest):
    """
    Extracts skills directly from raw text payload.
    """
    try:
        return extractor.extract_from_text(
            jd_text=payload.jd_text,
            source_file=payload.source_file or "raw_text.txt",
            company=payload.company,
            role=payload.role
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
