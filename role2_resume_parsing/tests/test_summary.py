"""Tests for M13: Tier 2 – Category summary, gap detection, and suggested additions.

Validates:
- generate_category_summary() computes correct rollups across all 12 RADIX categories
- categories_without_evidence correctly identifies empty categories
- suggested_manual_additions gives actionable guidance per candidate
- Pipeline end-to-end produces a non-null category_summary and populates meta fields
- Gold-file absent_categories match actual gaps in parsed output
"""

import json
import os

import pytest

from contract.schema import CategorySummaryItem, ResumeParseResult, Skill
from resume_parser.summary import RADIX_12_CATEGORIES, generate_category_summary
from resume_parser.pipeline import parse_resume
from shared.llm_client import LLMClient


# ----- Unit tests for generate_category_summary() -----


def _make_skill(name, cat, conf="high", evidence="some evidence text"):
    return Skill(
        skill_name=name,
        category_code=cat,
        evidence=evidence,
        confidence=conf,
        evidence_verified=True,
        source_section="technical_skills",
    )


class TestGenerateCategorySummary:
    """Unit tests for the summary generator."""

    def test_empty_skills_list(self):
        """All 12 categories should appear with zero counts and no evidence."""
        summary, without_ev, suggested = generate_category_summary([])
        assert len(summary) == 12
        for cat in RADIX_12_CATEGORIES:
            assert cat in summary
            item = summary[cat]
            assert item.skill_count == 0
            assert item.has_evidence is False
            assert item.strongest_confidence is None
            assert item.strongest_evidence is None
        assert set(without_ev) == set(RADIX_12_CATEGORIES)
        assert set(suggested) == set(RADIX_12_CATEGORIES)

    def test_single_category_with_one_skill(self):
        """One COD skill → COD has count=1, has_evidence=True; 11 others have nothing."""
        skills = [_make_skill("Python", "COD", "high", "Python")]
        summary, without_ev, suggested = generate_category_summary(skills)
        assert summary["COD"].skill_count == 1
        assert summary["COD"].has_evidence is True
        assert summary["COD"].strongest_confidence == "high"
        assert "COD" not in without_ev
        assert "COD" not in suggested
        # Other 11 categories should be empty
        for cat in RADIX_12_CATEGORIES:
            if cat != "COD":
                assert summary[cat].skill_count == 0
                assert summary[cat].has_evidence is False
                assert cat in without_ev

    def test_strongest_confidence_ranking(self):
        """With mixed confidences, strongest_confidence should be 'high'."""
        skills = [
            _make_skill("Java", "COD", "low", "Java"),
            _make_skill("Python", "COD", "high", "Python (proficient in)"),
            _make_skill("C++", "COD", "medium", "C++"),
        ]
        summary, _, _ = generate_category_summary(skills)
        assert summary["COD"].skill_count == 3
        assert summary["COD"].strongest_confidence == "high"
        # The evidence should be from the highest-confidence skill with longest evidence
        assert summary["COD"].strongest_evidence == "Python (proficient in)"

    def test_multiple_categories(self):
        """Skills spanning multiple categories all get correct summaries."""
        skills = [
            _make_skill("Python", "COD", "high", "Python"),
            _make_skill("SQL", "SQL", "high", "SQL (expert)"),
            _make_skill("Machine Learning", "AI", "medium", "ML models"),
        ]
        summary, without_ev, _ = generate_category_summary(skills)
        assert summary["COD"].skill_count == 1
        assert summary["SQL"].skill_count == 1
        assert summary["AI"].skill_count == 1
        # 9 other categories should be empty
        assert len(without_ev) == 9
        assert "COD" not in without_ev
        assert "SQL" not in without_ev
        assert "AI" not in without_ev

    def test_other_category_excluded(self):
        """Skills with category_code=OTHER should not appear in RADIX 12 summary."""
        skills = [_make_skill("pandas", "OTHER", "high", "pandas library")]
        summary, without_ev, _ = generate_category_summary(skills)
        assert "OTHER" not in summary
        assert len(summary) == 12
        # All 12 categories should be without evidence (OTHER is not one of them)
        assert len(without_ev) == 12

    def test_suggested_manual_additions_matches_without_evidence(self):
        """suggested_manual_additions should exactly match categories_without_evidence."""
        skills = [_make_skill("Python", "COD", "high", "Python")]
        _, without_ev, suggested = generate_category_summary(skills)
        assert without_ev == suggested


# ----- Integration tests: pipeline produces valid category_summary -----


CANDIDATES = [
    ("Ananya Rao", "Ananya Rao.pdf", "ananya_rao.json"),
    ("Karthik Subramaniam", "Karthik Subramaniam.pdf", "karthik_subramaniam.json"),
    ("Priya Menon", "Priya Menon.pdf", "priya_menon.json"),
    ("Rohan Verma", "Rohan Verma.pdf", "rohan_verma.json"),
]


@pytest.mark.parametrize("candidate_name,filename,gold_file", CANDIDATES)
def test_pipeline_category_summary_present(candidate_name, filename, gold_file):
    """Pipeline output should include a non-null category_summary covering all 12 cats."""
    filepath = os.path.join("data", "resumes", "PDF", filename)
    client = LLMClient(mode="replay")
    result = parse_resume(filepath, use_llm=True, client=client)

    assert result.category_summary is not None
    assert len(result.category_summary) == 12

    for cat in RADIX_12_CATEGORIES:
        assert cat in result.category_summary
        item = result.category_summary[cat]
        assert isinstance(item, CategorySummaryItem)
        if item.skill_count > 0:
            assert item.has_evidence is True
            assert item.strongest_confidence is not None
            assert item.strongest_evidence is not None
        else:
            assert item.has_evidence is False


@pytest.mark.parametrize("candidate_name,filename,gold_file", CANDIDATES)
def test_meta_categories_without_evidence(candidate_name, filename, gold_file):
    """meta.categories_without_evidence should match gold absent_categories."""
    filepath = os.path.join("data", "resumes", "PDF", filename)
    client = LLMClient(mode="replay")
    result = parse_resume(filepath, use_llm=True, client=client)

    gold_path = os.path.join("gold", gold_file)
    with open(gold_path, "r", encoding="utf-8") as f:
        gold = json.load(f)

    gold_absent = set(gold.get("absent_categories", []))
    actual_absent = set(result.meta.categories_without_evidence)

    # Every gold-expected absent category should be absent in parsed output
    for cat in gold_absent:
        assert cat in actual_absent, (
            f"Expected {cat} to be absent for {candidate_name}, "
            f"but it has skills in the parsed output"
        )


@pytest.mark.parametrize("candidate_name,filename,gold_file", CANDIDATES)
def test_suggested_manual_additions_populated(candidate_name, filename, gold_file):
    """meta.suggested_manual_additions should be non-empty for all candidates."""
    filepath = os.path.join("data", "resumes", "PDF", filename)
    client = LLMClient(mode="replay")
    result = parse_resume(filepath, use_llm=True, client=client)

    # Every candidate has at least some categories without evidence
    assert len(result.meta.suggested_manual_additions) > 0
    # suggested_manual_additions should be a subset of RADIX_12_CATEGORIES
    for cat in result.meta.suggested_manual_additions:
        assert cat in RADIX_12_CATEGORIES


@pytest.mark.parametrize("candidate_name,filename,gold_file", CANDIDATES)
def test_category_summary_skill_counts_consistent(candidate_name, filename, gold_file):
    """Sum of skill_count across all categories should equal skills in those categories."""
    filepath = os.path.join("data", "resumes", "PDF", filename)
    client = LLMClient(mode="replay")
    result = parse_resume(filepath, use_llm=True, client=client)

    for cat in RADIX_12_CATEGORIES:
        expected_count = sum(
            1 for s in result.profile_prefill.skills if s.category_code == cat
        )
        assert result.category_summary[cat].skill_count == expected_count, (
            f"Mismatch for {cat} in {candidate_name}: "
            f"summary says {result.category_summary[cat].skill_count}, "
            f"but found {expected_count} skills"
        )
