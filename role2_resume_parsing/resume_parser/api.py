"""FastAPI service for Role 2 Resume Parsing.

Provides:
- POST /parse-resume: Multipart file upload returning schema-valid JSON.
- GET /health: Health check and service metadata.
- CORS support for React frontend integration.
"""

import os
import sys
import tempfile
import logging
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from contract.schema import ResumeParseResult
from resume_parser.errors import (
    MAX_UPLOAD_BYTES,
    OVERSIZE_FILE_MESSAGE,
    UNSUPPORTED_FILE_MESSAGE,
    UNREADABLE_FILE_MESSAGE,
    classify_parse_error,
    error_payload,
)
from resume_parser.pipeline import parse_resume


logger = logging.getLogger(__name__)
load_dotenv()


def get_configured_port() -> int:
    """Return the API port from PORT, defaulting safely to 8000."""
    try:
        return int(os.getenv("PORT", "8000"))
    except ValueError:
        return 8000


def get_configured_cors_origins() -> list[str]:
    """Return comma-separated allowed origins with local frontend defaults."""
    raw_origins = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000",
    )
    return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]


PORT = get_configured_port()
CORS_ORIGINS = get_configured_cors_origins()

app = FastAPI(
    title="RADIX Talent Match - Role 2 Resume Parser",
    description="Automated resume information extraction and hiring-readiness grounding",
    version="1.0.0",
)

# Enable CORS for React frontend (localhost:3000, localhost:5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Service health check endpoint."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "module": "role_2_resume_parsing",
    }


@app.post("/parse-resume", response_model=ResumeParseResult)
async def parse_resume_endpoint(file: UploadFile = File(...)):
    """Upload a resume document (PDF or DOCX) and receive structured parse result.

    Args:
        file: Multipart file upload (.pdf or .docx)

    Returns:
        Structured ResumeParseResult matching contract schema v1.3.
    """
    if not file.filename:
        return JSONResponse(
            status_code=400,
            content=error_payload("missing_filename", UNSUPPORTED_FILE_MESSAGE),
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".docx"]:
        return JSONResponse(
            status_code=415,
            content=error_payload("unsupported_file_type", UNSUPPORTED_FILE_MESSAGE),
        )

    # Save to temporary file for safe ingestion
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp_path = tmp.name
            total_bytes = 0
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_BYTES:
                    logger.warning("Rejected oversize upload %s (%d bytes)", file.filename, total_bytes)
                    return JSONResponse(
                        status_code=413,
                        content=error_payload("file_too_large", OVERSIZE_FILE_MESSAGE),
                    )
                tmp.write(chunk)

        if os.path.getsize(tmp_path) == 0:
            logger.warning("Rejected empty upload %s", file.filename)
            return JSONResponse(
                status_code=422,
                content=error_payload("unreadable_file", UNREADABLE_FILE_MESSAGE),
            )

        result = parse_resume(tmp_path, use_llm=True)
        # Restore actual uploaded filename
        result.source_file = file.filename
        if result.profile_prefill:
            result.profile_prefill.cv_file = file.filename
        return result
    except Exception as error:
        code, message, status_code = classify_parse_error(error)
        if status_code == 500:
            logger.exception("Unexpected resume parse failure for %s", file.filename)
        else:
            logger.warning("Unreadable resume %s: %s", file.filename, error)
        return JSONResponse(
            status_code=status_code,
            content=error_payload(code, message),
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("resume_parser.api:app", host="0.0.0.0", port=PORT)
