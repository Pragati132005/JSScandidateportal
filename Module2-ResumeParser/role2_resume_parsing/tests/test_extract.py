"""Tests for resume_parser/extract.py in offline replay mode."""

import os
import pytest
from shared.ingest import extract_text
from shared.clean import clean_text
from resume_parser.segment import segment_resume
from resume_parser.extract import extract_resume_raw
from shared.llm_client import LLMClient


CANDIDATES = [
    "Ananya Rao",
    "Karthik Subramaniam",
    "Priya Menon",
    "Rohan Verma",
]


@pytest.mark.parametrize("candidate", CANDIDATES)
def test_extract_resume_raw_replay_pdf(candidate):
    """Test raw extraction in offline replay mode for PDF resumes."""
    pdf_path = os.path.join("data", "resumes", "PDF", f"{candidate}.pdf")
    ingest = extract_text(pdf_path)
    clean = clean_text(ingest.text)
    seg = segment_resume(clean.text)

    client = LLMClient(mode="replay")
    result = extract_resume_raw(clean.text, seg, client=client)

    raw = result["raw_extraction"]
    assert raw["name"] == candidate
    assert len(raw["skills"]) >= 6
    assert len(raw["education"]) >= 1
    assert result["meta"]["from_cache"] is True
    assert result["meta"]["prompt_version"] == "p4"


@pytest.mark.parametrize("candidate", CANDIDATES)
def test_extract_resume_raw_replay_docx(candidate):
    """Test raw extraction in offline replay mode for DOCX resumes."""
    docx_path = os.path.join("data", "resumes", "Word", f"{candidate}.docx")
    ingest = extract_text(docx_path)
    clean = clean_text(ingest.text)
    seg = segment_resume(clean.text)

    client = LLMClient(mode="replay")
    result = extract_resume_raw(clean.text, seg, client=client)

    raw = result["raw_extraction"]
    assert raw["name"] == candidate
    assert len(raw["skills"]) >= 6
    assert len(raw["education"]) >= 1
    assert result["meta"]["from_cache"] is True
    assert result["meta"]["prompt_version"] == "p4"
