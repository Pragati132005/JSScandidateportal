"""Regression coverage for taxonomy v1.1 and canonical section labels."""

import pytest

from resume_parser.dictionary import parse_resume_dictionary
from resume_parser.postprocess import postprocess_skills
from resume_parser.segment import SegmentResult, match_heading, segment_resume
from shared.taxonomy import normalise


@pytest.mark.parametrize(
    "skill,category",
    [
        ("C", "COD"),
        ("C#", "COD"),
        ("Go", "COD"),
        ("Rust", "COD"),
        ("JavaScript", "COD"),
        ("TypeScript", "COD"),
        ("Kotlin", "COD"),
        ("Swift", "COD"),
        ("PHP", "COD"),
        ("Ruby", "COD"),
        ("R", "COD"),
        ("MATLAB", "COD"),
        ("Lua", "COD"),
        ("Luau", "COD"),
        ("Dart", "COD"),
        ("Scala", "COD"),
        ("Bash/Shell", "COD"),
        ("HTML", "COD"),
        ("CSS", "COD"),
        ("Team Collaboration", "COMM"),
        ("teamwork", "COMM"),
        ("collaboration", "COMM"),
        ("Leadership", "COMM"),
        ("Presentation", "COMM"),
        ("Public Speaking", "COMM"),
        ("Technical Writing", "COMM"),
        ("React", "OTHER"),
        ("Node.js", "OTHER"),
        ("Django", "OTHER"),
        ("Flask", "OTHER"),
        ("Unity", "OTHER"),
        ("Photoshop", "OTHER"),
        ("SQLite", "SQL"),
        ("MongoDB", "SQL"),
        ("AWS", "CLOUD"),
        ("Azure", "CLOUD"),
        ("GCP", "CLOUD"),
    ],
)
def test_common_taxonomy_entries(skill, category):
    _, actual_category, _ = normalise(skill)
    assert actual_category == category


@pytest.mark.parametrize("skill", ["C", "C#", "Go", "R"])
def test_short_names_require_exact_case_sensitive_extractor_output(skill):
    canonical, category, _ = normalise(skill)
    assert (canonical, category) == (skill, "COD")

    lower = skill.lower()
    if lower != skill:
        lower_canonical, lower_category, _ = normalise(lower)
        assert lower_canonical == lower
        assert lower_category == "OTHER"


def test_short_names_are_not_free_text_dictionary_matches():
    segmented = SegmentResult(
        sections={"skills": "C R Go are mentioned in a sentence, with Rust and Luau."}
    )
    raw = parse_resume_dictionary(segmented.sections["skills"], segmented)
    names = {item["skill_name"] for item in raw["skills"]}
    assert {"C", "R", "Go"}.isdisjoint(names)
    assert {"Rust", "Luau"}.issubset(names)


@pytest.mark.parametrize(
    "heading,canonical",
    [
        ("SKILL", "skills"),
        ("SKILLS", "skills"),
        ("Key Skills", "skills"),
        ("Technical Skills", "skills"),
        ("Project", "projects"),
        ("Experience", "experience"),
        ("Education", "education"),
        ("Certification", "certifications"),
        ("Hackathon", "hackathons"),
        ("Achievement", "achievements"),
        ("Preferred Roles", "other"),
    ],
)
def test_heading_variants_map_to_canonical_sections(heading, canonical):
    assert match_heading(heading) == canonical


def test_source_section_is_canonical_after_postprocessing():
    skills, _, warnings, _ = postprocess_skills(
        raw_skills=[
            {
                "skill_name": "Team Collaboration",
                "evidence": "Team Collaboration",
                "confidence": "high",
                "source_section": "TECHNICAL SKILLS",
            }
        ],
        cleaned_text="Team Collaboration",
    )
    assert not warnings
    assert skills[0]["source_section"] == "skills"
    assert skills[0]["source_kind"] == "skills_list"


def test_segmented_sections_use_canonical_keys():
    result = segment_resume(
        "Alex Morgan\nSKILL\nPython\nEDUCATION\nB.Tech\nPROJECT\nBuilt a project\n"
        "EXPERIENCE\nA role\nHACKATHON\nA result\nCERTIFICATION\nA course\n"
        "ACHIEVEMENT\nA prize\nPREFERRED ROLES\nEngineer"
    )
    assert set(result.sections) == {
        "skills",
        "education",
        "projects",
        "experience",
        "hackathons",
        "certifications",
        "achievements",
        "other",
    }
