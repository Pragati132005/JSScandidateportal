"""Tests for packaging and integration: CLI, FastAPI endpoints, and warm cache (M11)."""

import os
import subprocess
import sys
from fastapi.testclient import TestClient
import resume_parser.api as api
from resume_parser.api import app
from contract.schema import ResumeParseResult


client = TestClient(app)


def test_api_environment_configuration(monkeypatch):
    monkeypatch.setenv("PORT", "9123")
    monkeypatch.setenv("CORS_ORIGINS", "http://frontend.test, http://admin.test")

    assert api.get_configured_port() == 9123
    assert api.get_configured_cors_origins() == [
        "http://frontend.test",
        "http://admin.test",
    ]


def test_api_health_endpoint():
    """Verify GET /health returns 200 OK and module metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["module"] == "role_2_resume_parsing"


def test_api_parse_resume_upload():
    """Verify POST /parse-resume accepts multipart upload and returns valid schema."""
    sample_pdf = os.path.join("data", "resumes", "PDF", "Rohan Verma.pdf")
    with open(sample_pdf, "rb") as f:
        response = client.post(
            "/parse-resume",
            files={"file": ("Rohan Verma.pdf", f, "application/pdf")},
        )

    assert response.status_code == 200
    data = response.json()
    # Validate with Pydantic model
    parsed = ResumeParseResult.model_validate(data)
    assert parsed.profile_prefill.name == "Rohan Verma"
    assert len(parsed.profile_prefill.skills) > 0


def test_api_unsupported_file_extension():
    """Verify POST /parse-resume returns a stable unsupported-file response."""
    response = client.post(
        "/parse-resume",
        files={"file": ("invalid_resume.txt", b"plain text content", "text/plain")},
    )
    assert response.status_code == 415
    assert response.json() == {
        "error": "unsupported_file_type",
        "message": "This file type isn’t supported. Please upload a PDF or DOCX file.",
    }


def test_api_empty_upload_returns_friendly_error():
    response = client.post(
        "/parse-resume",
        files={"file": ("empty.pdf", b"", "application/pdf")},
    )
    assert response.status_code == 422
    assert response.json() == {
        "error": "unreadable_file",
        "message": "This file couldn’t be read. It may be empty or corrupted.",
    }


def test_api_corrupt_upload_returns_friendly_error():
    response = client.post(
        "/parse-resume",
        files={"file": ("corrupt.pdf", b"not a PDF", "application/pdf")},
    )
    assert response.status_code == 422
    assert response.json()["error"] == "unreadable_file"
    assert response.json()["message"] == "This file couldn’t be read. It may be empty or corrupted."


def test_api_oversize_upload_returns_friendly_error(monkeypatch):
    monkeypatch.setattr("resume_parser.api.MAX_UPLOAD_BYTES", 4)
    response = client.post(
        "/parse-resume",
        files={"file": ("large.pdf", b"12345", "application/pdf")},
    )
    assert response.status_code == 413
    assert response.json() == {
        "error": "file_too_large",
        "message": "This file is too large. Please upload a file under 10 MB.",
    }


def test_cli_execution_with_output(tmp_path):
    """Verify CLI parses resume and writes JSON to output file."""
    sample_pdf = os.path.join("data", "resumes", "PDF", "Ananya Rao.pdf")
    out_file = str(tmp_path / "ananya_out.json")

    cmd = [
        sys.executable,
        "-m",
        "resume_parser.cli",
        "parse",
        sample_pdf,
        "--out",
        out_file,
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    assert res.returncode == 0
    assert os.path.exists(out_file)


def test_cli_no_llm_flag(tmp_path):
    """Verify CLI executes in zero-LLM mode with --no-llm flag."""
    sample_docx = os.path.join("data", "resumes", "Word", "Priya Menon.docx")
    out_file = str(tmp_path / "priya_out.json")

    cmd = [
        sys.executable,
        "-m",
        "resume_parser.cli",
        "parse",
        sample_docx,
        "--no-llm",
        "--out",
        out_file,
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    assert res.returncode == 0
    assert os.path.exists(out_file)
