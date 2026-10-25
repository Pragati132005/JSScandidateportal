"""Tests for rule-based dictionary parser and consensus fusion (M8)."""

import os
import pytest
from contract.schema import ResumeParseResult
from resume_parser.dictionary import parse_resume_dictionary
from resume_parser.fuse import choose_name_candidate, fuse_skills, elevate_confidence
from resume_parser.pipeline import parse_resume
from resume_parser.segment import SegmentResult, segment_resume
from shared.clean import clean_text
from shared.ingest import extract_text
from resume_parser.postprocess import postprocess_skills


CANDIDATES = [
    ("Ananya Rao", ["C++", "Python", "Java", "Data Structures & Algorithms", "Operating Systems", "Computer Networks", "Object-Oriented Design", "Git", "Linux"]),
    ("Karthik Subramaniam", ["SQL", "Python", "pandas", "scikit-learn", "Power BI", "Statistics", "A/B Testing", "Excel", "Java"]),
    ("Priya Menon", ["SQL", "Java", "Linux", "Computer Networks", "Excel", "Ticketing Tools"]),
    ("Rohan Verma", ["C++", "Python", "SQL", "Data Structures & Algorithms", "System Design", "Object-Oriented Design", "Operating Systems", "Machine Learning", "Git", "Docker"]),
]


@pytest.mark.parametrize("candidate_name,expected_core_skills", CANDIDATES)
def test_zero_llm_parsing_pdf(candidate_name, expected_core_skills):
    """Verify all resumes parse with use_llm=False into schema-valid results containing core skills."""
    pdf_path = os.path.join("data", "resumes", "PDF", f"{candidate_name}.pdf")
    res = parse_resume(pdf_path, use_llm=False)

    assert isinstance(res, ResumeParseResult)
    assert res.profile_prefill.name == candidate_name
    assert res.meta.model_used == "rule-based-dictionary"
    assert "LLM disabled" in " ".join(res.meta.parse_warnings)

    extracted_skill_names = {s.skill_name for s in res.profile_prefill.skills}
    for core in expected_core_skills:
        assert core in extracted_skill_names, f"Expected core skill '{core}' missing in zero-LLM output for {candidate_name}"


def test_confidence_elevation_in_fusion():
    """Verify consensus elevates confidence tier."""
    assert elevate_confidence("low") == "medium"
    assert elevate_confidence("medium") == "high"
    assert elevate_confidence("high") == "high"

    llm_skills = [
        {"skill_name": "Python", "confidence": "medium", "evidence": "Python programming", "evidence_verified": True}
    ]
    dict_skills = [
        {"skill_name": "Python", "confidence": "high", "evidence": "C++, Python, Java", "source_section": "skills"}
    ]
    fused = fuse_skills(llm_skills, dict_skills)
    assert len(fused) == 1
    assert fused[0]["confidence"] == "high"


def test_postprocess_strips_leading_bullet_from_evidence():
    skills, _, warnings, dropped_skills = postprocess_skills(
        raw_skills=[
            {
                "skill_name": "Python",
                "category_code": "COD",
                "evidence": "â€¢ Built a Python service",
                "confidence": "medium",
                "source_section": "projects",
            }
        ],
        cleaned_text="â€¢ Built a Python service",
    )
    assert not warnings
    assert skills[0]["evidence"] == "Built a Python service"
    assert skills[0]["evidence_verified"] is True
    assert dropped_skills == []


def test_postprocess_records_dropped_unsupported_skill():
    skills, _, warnings, dropped_skills = postprocess_skills(
        raw_skills=[{
            "skill_name": "Invented Framework",
            "evidence": "Built an Invented Framework platform",
            "confidence": "high",
            "source_section": "projects",
        }],
        cleaned_text="Built a Python service",
    )

    assert skills == []
    assert warnings == ["Dropped unsupported skill: 'Invented Framework'"]
    assert dropped_skills == [{
        "skill_name": "Invented Framework",
        "claimed_evidence": "Built an Invented Framework platform",
        "reason": "claimed evidence is not grounded in the resume and the skill name is absent",
    }]


def test_dictionary_keeps_full_degree_phrase_and_extracts_inline_field():
    segmented = SegmentResult(
        sections={"education": "Bachelor of Science in Computer Science\nExample University\n2025"}
    )

    raw = parse_resume_dictionary("", segmented)

    assert raw["education"] == [{
        "degree": "Bachelor of Science",
        "field": "Computer Science",
        "institution": "Example University",
        "graduation_year": 2025,
        "grade": None,
        "grade_scale": None,
    }]


def test_dictionary_keeps_degree_when_no_field_is_listed():
    segmented = SegmentResult(
        sections={"education": "Bachelor of Science\nExample University\n2025"}
    )

    raw = parse_resume_dictionary("", segmented)

    assert raw["education"][0]["degree"] == "Bachelor of Science"
    assert raw["education"][0]["field"] is None


def test_name_selector_prefers_font_candidate_supported_by_email():
    assert choose_name_candidate(
        ["LANDON", "LANDON WINSLOW", "Senior Engineer"],
        email="l.winslow@example.com",
    ) == "LANDON WINSLOW"


def test_name_selector_never_downgrades_valid_multi_token_name():
    assert choose_name_candidate(["ARABELLA WHITAKER", "ARABELLA"]) == "ARABELLA WHITAKER"
