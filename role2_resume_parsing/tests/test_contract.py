"""Tests for Role 2 contract schema and fixtures."""

import json
import os
import pytest
from pydantic import ValidationError
from contract.schema import (
    ResumeParseResult,
    Skill,
    ProfilePrefill,
    export_json_schema,
)


def test_rohan_verma_fixture_valid():
    """Verify Rohan Verma hand-written fixture validates against Pydantic schema."""
    fixture_path = os.path.join("contract", "fixtures", "rohan_verma.parse.json")
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    result = ResumeParseResult.model_validate(data)
    assert result.source_type == "resume"
    assert result.profile_prefill.name == "Rohan Verma"
    assert len(result.skills) > 0
    assert result.company is None
    assert result.role is None
    assert result.profile_prefill.certifications == []
    assert len(result.profile_prefill.hackathons) == 1
    assert result.profile_prefill.hackathons[0].result == "Winner"
    assert len(result.profile_prefill.internships) == 1


def test_priya_menon_fixture_valid():
    """Verify Priya Menon hand-written fixture validates against Pydantic schema."""
    fixture_path = os.path.join("contract", "fixtures", "priya_menon.parse.json")
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    result = ResumeParseResult.model_validate(data)
    assert result.source_type == "resume"
    assert result.profile_prefill.name == "Priya Menon"
    assert len(result.skills) > 0
    assert result.profile_prefill.certifications == ["Cisco Networking Basics (online course)"]
    assert len(result.profile_prefill.hackathons) == 1
    assert len(result.profile_prefill.internships) == 1


def test_invalid_category_code_fails():
    """Verify invalid category code raises ValidationError."""
    with pytest.raises(ValidationError):
        Skill(
            skill_name="Invalid Skill",
            category_code="NOT_A_CATEGORY",  # type: ignore
            evidence="Some evidence",
            confidence="high",
        )


def test_invalid_confidence_fails():
    """Verify invalid confidence level raises ValidationError."""
    with pytest.raises(ValidationError):
        Skill(
            skill_name="Python",
            category_code="COD",
            evidence="Python mentioned",
            confidence="super_high",  # type: ignore
        )


def test_extra_forbidden_fields_fail():
    """Verify extra attributes are forbidden per schema design."""
    fixture_path = os.path.join("contract", "fixtures", "rohan_verma.parse.json")
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    data["unexpected_top_level_key"] = "illegal"
    with pytest.raises(ValidationError):
        ResumeParseResult.model_validate(data)


def test_json_schema_export(tmp_path):
    """Verify export_json_schema outputs valid JSON Schema."""
    out_file = tmp_path / "schema.json"
    export_json_schema(str(out_file))
    assert out_file.exists()

    with open(out_file, "r", encoding="utf-8") as f:
        schema = json.load(f)
    assert schema["title"] == "ResumeParseResult"
    assert "properties" in schema
    assert "profile_prefill" in schema["properties"]
