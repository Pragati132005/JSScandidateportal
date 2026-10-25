"""Tests for shared/clean.py and resume_parser/segment.py."""

import os
import pytest
from shared.ingest import extract_text
from shared.clean import clean_text
from resume_parser.segment import segment_resume, match_heading, is_fit_label


CANDIDATES = [
    "Ananya Rao",
    "Karthik Subramaniam",
    "Priya Menon",
    "Rohan Verma",
]

EXPECTED_SECTIONS = [
    "education",
    "skills",
    "projects",
    "hackathons_internships",
    "certifications",
    "achievements",
    "preferred_roles",
]


@pytest.mark.parametrize("candidate", CANDIDATES)
def test_clean_and_segment_pdf(candidate):
    """Test that all 4 PDFs clean and segment into expected sections."""
    pdf_path = os.path.join("data", "resumes", "PDF", f"{candidate}.pdf")
    ingest = extract_text(pdf_path)
    clean = clean_text(ingest.text)
    segment = segment_resume(clean.text)

    # Name is identified
    assert segment.candidate_name == candidate

    # Headline is identified and excluded
    assert segment.headline_fit_label is not None
    assert segment.headline_fit_label in segment.non_evidence_lines

    # Ensure headline text is NOT in any section
    for sec_name, sec_text in segment.sections.items():
        assert segment.headline_fit_label not in sec_text

    # Expected sections are found
    for exp in EXPECTED_SECTIONS:
        assert exp in segment.sections, f"Missing section {exp} for {candidate}"
        assert len(segment.sections[exp].strip()) > 0


@pytest.mark.parametrize("candidate", CANDIDATES)
def test_pdf_docx_equivalence(candidate):
    """Test that PDF and DOCX versions yield equivalent section keys and candidate names."""
    pdf_path = os.path.join("data", "resumes", "PDF", f"{candidate}.pdf")
    docx_path = os.path.join("data", "resumes", "Word", f"{candidate}.docx")

    seg_pdf = segment_resume(clean_text(extract_text(pdf_path).text).text)
    seg_docx = segment_resume(clean_text(extract_text(docx_path).text).text)

    assert seg_pdf.candidate_name == seg_docx.candidate_name
    assert set(seg_pdf.sections.keys()) == set(seg_docx.sections.keys())


def test_rohan_pdf_header_footer_removal():
    """Verify RADIX header and Page 1 footer in Rohan's PDF are cleaned."""
    pdf_path = os.path.join("data", "resumes", "PDF", "Rohan Verma.pdf")
    raw_text = extract_text(pdf_path).text
    assert "RADIX Talent Match Hackathon" in raw_text

    cleaned = clean_text(raw_text)
    assert "RADIX Talent Match Hackathon" not in cleaned.text
    assert "Page 1" not in cleaned.text


def test_hyphenation_rejoining():
    """Verify hyphenated line breaks are properly rejoined."""
    broken = "Designed a horizontally-\nscalable architecture for workers."
    cleaned = clean_text(broken)
    assert "horizontally-scalable" in cleaned.text
    assert "horizontally-\nscalable" not in cleaned.text


def test_broken_bullet_collapse():
    """Verify multi-line wrapped bullet points are collapsed."""
    wrapped = "• Designed and built a scalable notification service\nwith horizontally-scalable workers."
    cleaned = clean_text(wrapped)
    assert "\n" not in cleaned.text
    assert "Designed and built a scalable notification service with horizontally-scalable workers." in cleaned.text


def test_unsegmented_fallback():
    """Verify text with no headings returns gracefully with unsegmented section."""
    plain = "John Doe\nI am a software engineer with 5 years experience in Python and Go."
    seg = segment_resume(plain)
    assert "unsegmented" in seg.sections
    assert len(seg.warnings) > 0
