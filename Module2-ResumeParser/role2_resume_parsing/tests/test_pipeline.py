"""Tests for end-to-end pipeline in resume_parser/pipeline.py."""

import os
import pytest
from contract.schema import ResumeParseResult
from resume_parser.pipeline import parse_resume
from shared.llm_client import LLMClient, LLMResponse


CANDIDATES = [
    ("Ananya Rao", "Ananya Rao.pdf"),
    ("Karthik Subramaniam", "Karthik Subramaniam.pdf"),
    ("Priya Menon", "Priya Menon.pdf"),
    ("Rohan Verma", "Rohan Verma.pdf"),
    ("Ananya Rao", "Ananya Rao.docx"),
    ("Karthik Subramaniam", "Karthik Subramaniam.docx"),
    ("Priya Menon", "Priya Menon.docx"),
    ("Rohan Verma", "Rohan Verma.docx"),
]


@pytest.mark.parametrize("candidate_name,filename", CANDIDATES)
def test_pipeline_end_to_end_replay(candidate_name, filename):
    """Verify end-to-end pipeline runs offline in replay mode for all 8 files."""
    subdir = "PDF" if filename.endswith(".pdf") else "Word"
    filepath = os.path.join("data", "resumes", subdir, filename)

    client = LLMClient(mode="replay")
    result = parse_resume(filepath, use_llm=True, client=client)

    # 1. Schema validation
    assert isinstance(result, ResumeParseResult)
    assert result.source_type == "resume"
    assert result.source_file == filename
    assert result.company is None
    assert result.role is None

    # 2. Candidate profile prefill
    prefill = result.profile_prefill
    assert prefill.name == candidate_name
    assert prefill.email is None  # None of the resumes have an email
    assert prefill.education is not None
    assert len(prefill.skills) >= 6

    # 3. Grounding checks: all verified skills must have evidence in source
    for skill in prefill.skills:
        if skill.evidence_verified:
            assert len(skill.evidence) > 0
            assert "strong fit" not in skill.evidence.lower()
            assert "systems-leaning" not in skill.evidence.lower()

    # 4. Placeholder certification checks
    if candidate_name in ["Ananya Rao", "Rohan Verma"]:
        assert prefill.certifications == [], f"{candidate_name} must have empty certifications"
    elif candidate_name == "Karthik Subramaniam":
        assert any("Google Data Analytics" in c for c in prefill.certifications)
    elif candidate_name == "Priya Menon":
        assert any("Cisco Networking" in c for c in prefill.certifications)

    # 5. Metadata checks
    meta = result.meta
    assert meta.parser_version == "1.3"
    assert meta.from_cache is True
    assert len(meta.categories_without_evidence) > 0
    assert "No email address listed" in " ".join(meta.parse_warnings)
    assert all(skill.source_kind for skill in prefill.skills)


def test_pipeline_partial_mock_llm_output_keeps_core_fields():
    class PartialMockClient:
        def generate(self, **kwargs):
            return LLMResponse(
                content="{}",
                parsed_json={
                    "name": None,
                    "email": None,
                    "skills": [
                        {
                            "skill_name": "Python",
                            "category_code": "COD",
                            "evidence": "Python",
                            "confidence": "high",
                        },
                        {"skill_name": None},
                        None,
                    ],
                    "education": [{"degree": None, "field": None}],
                    "projects": [
                        {"title": None, "description": "Built a resilient service"},
                        "not a project object",
                    ],
                    "experience": [{"role": None, "organization": None}],
                    "hackathons": [{"title": None, "description": None}],
                    "internships": [{"role": None, "description": None}],
                    "certifications": [None],
                    "preferred_roles": [None],
                },
                model_used="mock-model",
                provider_used="mock",
            )

    path = os.path.join("data", "resumes", "PDF", "Ananya Rao.pdf")
    result = parse_resume(path, use_llm=True, client=PartialMockClient())

    assert result.profile_prefill.name == "Ananya Rao"
    assert result.profile_prefill.skills
    assert result.details.projects[0].title == "Built a resilient service"
    assert any("Dropped invalid" in warning for warning in result.meta.parse_warnings)
