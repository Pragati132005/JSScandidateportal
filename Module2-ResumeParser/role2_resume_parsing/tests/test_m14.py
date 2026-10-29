"""Tests for M14 optional OCR and source-weighted skill signals."""

import os

from contract.schema import ResumeParseResult
from resume_parser.pipeline import parse_resume
from scripts.make_adversarial import make_resume_f
from shared.ingest import extract_text


def test_pipeline_populates_source_kind():
    path = os.path.join("data", "resumes", "PDF", "Ananya Rao.pdf")
    result = parse_resume(path, use_llm=False)

    assert isinstance(result, ResumeParseResult)
    assert result.skills
    allowed = {
        "skills_list",
        "project",
        "internship",
        "experience",
        "certification",
        "achievement",
        "unknown",
        "coursework",
    }
    assert all(skill.source_kind in allowed for skill in result.skills)
    assert any(skill.source_kind == "skills_list" for skill in result.skills)


def test_scanned_pdf_ocr_is_optional_and_non_fatal(tmp_path):
    make_resume_f(str(tmp_path))
    path = tmp_path / "adversarial_f_scanned.pdf"

    ingest = extract_text(str(path))
    assert ingest.input_format == "pdf"
    assert ingest.text or any(
        "OCR" in warning or "No extractable text" in warning
        for warning in ingest.warnings
    )

    result = parse_resume(str(path), use_llm=False)
    assert isinstance(result, ResumeParseResult)
    if not ingest.text:
        assert any("OCR" in warning or "No extractable text" in warning for warning in result.meta.parse_warnings)
