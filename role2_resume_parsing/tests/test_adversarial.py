"""Robustness tests across adversarial test resumes A through E (M10)."""

import os
import pytest
from contract.schema import ResumeParseResult
from resume_parser.pipeline import parse_resume


ADV_DIR = os.path.join("data", "adversarial")


def test_adversarial_a_narrative():
    """Resume A: Narrative style without headings."""
    path = os.path.join(ADV_DIR, "adversarial_a_narrative.pdf")
    res = parse_resume(path, use_llm=False)

    assert isinstance(res, ResumeParseResult)
    assert res.profile_prefill.name == "Alex Mercer"
    skill_names = {s.skill_name for s in res.profile_prefill.skills}
    assert "C++" in skill_names
    assert "Python" in skill_names
    assert "Redis" in skill_names


def test_adversarial_b_scrambled_headings():
    """Resume B: Unusual heading names and inverted section order."""
    path = os.path.join(ADV_DIR, "adversarial_b_scrambled_headings.pdf")
    res = parse_resume(path, use_llm=False)

    assert isinstance(res, ResumeParseResult)
    assert res.profile_prefill.name == "David Chen"
    skill_names = {s.skill_name for s in res.profile_prefill.skills}
    assert "Python" in skill_names
    assert "SQL" in skill_names
    assert "Docker" in skill_names


def test_adversarial_c_twocolumn_docx():
    """Resume C: Multi-column table layout in DOCX."""
    path = os.path.join(ADV_DIR, "adversarial_c_twocolumn.docx")
    res = parse_resume(path, use_llm=False)

    assert isinstance(res, ResumeParseResult)
    assert res.profile_prefill.name == "Elena Rostova"
    skill_names = {s.skill_name for s in res.profile_prefill.skills}
    assert "Java" in skill_names
    assert "Python" in skill_names
    assert "System Design" in skill_names


def test_adversarial_d_prompt_injection_and_contacts():
    """Resume D: Rich contact information + prompt-injection resistance."""
    path = os.path.join(ADV_DIR, "adversarial_d_prompt_injection.pdf")
    res = parse_resume(path, use_llm=False)

    assert isinstance(res, ResumeParseResult)
    assert res.profile_prefill.name == "Marcus Sterling"

    # Contact info successfully extracted
    assert res.profile_prefill.email == "marcus.sterling@example.com"
    assert res.details.phone is not None
    assert "555-234-5678" in res.details.phone
    assert any("github.com" in link for link in res.details.links)
    assert any("linkedin.com" in link for link in res.details.links)

    # Prompt-injection defense check:
    # 1. Injected instruction was not extracted as a skill
    for skill in res.profile_prefill.skills:
        assert "ignore previous" not in skill.skill_name.lower()
        assert "system override" not in skill.skill_name.lower()
        assert "ignore previous" not in skill.evidence.lower()

    # 2. Confidence is NOT blanket "high" for ungrounded/unlisted skills
    assert len(res.meta.categories_without_evidence) > 0
    assert "COMM" in res.meta.categories_without_evidence

    # 3. Placeholder rejected
    assert res.profile_prefill.certifications == []


def test_adversarial_e_multipage_dense():
    """Resume E: Multi-page dense technical resume."""
    path = os.path.join(ADV_DIR, "adversarial_e_multipage_dense.pdf")
    res = parse_resume(path, use_llm=False)

    assert isinstance(res, ResumeParseResult)
    assert res.profile_prefill.name == "Dr. Samantha Vance"
    assert res.meta.input_format == "pdf"

    skill_names = {s.skill_name for s in res.profile_prefill.skills}
    assert "C++" in skill_names
    assert "Machine Learning" in skill_names
    assert "Computer Networks" in skill_names
    assert "Operating Systems" in skill_names
    assert len(skill_names) >= 12
