"""Regression tests for profile prefill field selection."""

import os

import pytest

from resume_parser.pipeline import parse_resume
from resume_parser.prefill import build_prefill_and_details, extract_education_summary_string


SAMPLE_EDUCATION = {
    "Ananya Rao": "B.Tech, Computer Science and Engineering, Class of 2026  —  CGPA 8.6 / 10",
    "Karthik Subramaniam": "B.Tech, Computer Science and Engineering, Class of 2026  —  CGPA 8.2 / 10",
    "Priya Menon": "B.Tech, Information Technology, Class of 2026  —  CGPA 7.4 / 10",
    "Rohan Verma": "B.Tech, Computer Science and Engineering, Class of 2026  —  CGPA 9.1 / 10",
}

SAMPLE_NAMES = {
    "Ananya Rao": "Ananya Rao",
    "Karthik Subramaniam": "Karthik Subramaniam",
    "Priya Menon": "Priya Menon",
    "Rohan Verma": "Rohan Verma",
}


def test_education_summary_skips_leading_job_title():
    summary = extract_education_summary_string(
        raw_education=[],
        sections={"education": "Web Developer Intern\nB.S.\nComputer Science"},
        education_details=[{"degree": "B.S.", "field": "Computer Science"}],
    )

    assert summary == "B.S., Computer Science"


def test_split_line_education_uses_structured_entry():
    summary = extract_education_summary_string(
        raw_education=[],
        sections={"education": "B.S.\nComputer Science\nExample University\n2025\nGPA: 3.8"},
        education_details=[
            {
                "degree": "B.S.",
                "field": "Computer Science",
                "institution": "Example University",
                "graduation_year": 2025,
                "grade": "3.8",
                "grade_scale": "4.0",
            }
        ],
    )

    assert summary == "B.S., Computer Science, Example University, 2025 — GPA 3.8 / 4.0"


def test_split_line_education_keeps_safe_line_when_details_empty():
    summary = extract_education_summary_string(
        raw_education=[],
        sections={"education": "B.S.\nComputer Science\nExample University"},
        education_details=[],
    )

    assert summary == "B.S."


def test_education_summary_formats_structured_fallback():
    summary = extract_education_summary_string(
        raw_education=[],
        sections={"education": "Career transition"},
        education_details=[
            {
                "degree": "Master of Science",
                "field": "Data Analytics",
                "institution": "Example University",
                "graduation_year": 2024,
                "grade": "3.8",
                "grade_scale": "GPA",
            }
        ],
    )

    assert summary == "Master of Science, Data Analytics, Example University, 2024 — GPA 3.8"


def test_education_summary_returns_none_without_entry():
    assert extract_education_summary_string(
        raw_education=[],
        sections={"education": "Career transition"},
        education_details=[],
    ) is None


def test_partial_nested_payload_is_repaired_without_aborting():
    warnings = []
    prefill, details = build_prefill_and_details(
        raw_dict={
            "name": "Example Candidate",
            "email": "candidate@example.com",
            "education": [
                {"degree": None, "field": None, "institution": None},
                "not an education object",
            ],
            "projects": [
                {"title": None, "description": "Built a resilient search service", "technologies": [None, "Python"]},
                {"title": None, "description": None},
                "not a project object",
            ],
            "experience": [{"role": None, "organization": None, "description": None}, None],
            "hackathons": [{"title": None, "result": None, "kind": None, "description": None}, None],
            "internships": [{"role": None, "organization": None, "description": None}, None],
            "certifications": [None, "Cloud Fundamentals"],
            "preferred_roles": [None, "Backend Engineer"],
        },
        skills=[
            {"skill_name": "Python", "category_code": "COD", "evidence": "Python", "confidence": "high"},
            {"skill_name": None},
            None,
        ],
        source_filename="partial.pdf",
        warnings=warnings,
    )

    assert prefill.name == "Example Candidate"
    assert [skill.skill_name for skill in prefill.skills] == ["Python"]
    assert details.projects[0].title == "Built a resilient search service"
    assert details.projects[0].technologies == ["Python"]
    assert details.experience[0].role is None
    assert warnings
    assert any("Dropped invalid" in warning for warning in warnings)


def test_project_without_title_uses_description_words():
    _, details = build_prefill_and_details(
        raw_dict={"projects": [{"description": "Designed a compact metrics dashboard for teams"}]},
        skills=[],
        source_filename="project.pdf",
    )

    assert details.projects[0].title == "Designed a compact metrics dashboard for"


@pytest.mark.parametrize("candidate,expected", SAMPLE_EDUCATION.items())
@pytest.mark.parametrize("folder,suffix", [("PDF", ".pdf"), ("Word", ".docx")])
def test_sample_education_strings_remain_byte_identical(candidate, expected, folder, suffix):
    path = os.path.join("data", "resumes", folder, f"{candidate}{suffix}")
    result = parse_resume(path, use_llm=False)

    assert result.profile_prefill.education == expected


@pytest.mark.parametrize("candidate,expected", SAMPLE_NAMES.items())
@pytest.mark.parametrize("folder,suffix", [("PDF", ".pdf"), ("Word", ".docx")])
def test_sample_names_remain_byte_identical(candidate, expected, folder, suffix):
    path = os.path.join("data", "resumes", folder, f"{candidate}{suffix}")
    result = parse_resume(path, use_llm=False)

    assert result.profile_prefill.name == expected
