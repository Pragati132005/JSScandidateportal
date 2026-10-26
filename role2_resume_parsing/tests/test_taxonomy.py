"""Tests for shared/taxonomy.py and taxonomy_v1.json."""

import pytest
from shared.taxonomy import normalise, SkillTaxonomy


def test_taxonomy_version():
    """Verify taxonomy loads v1.1 and contains 13 categories (12 + OTHER)."""
    tax = SkillTaxonomy.get_instance()
    assert tax.version == "v1.1"
    assert len(tax.categories) == 13
    assert "COD" in tax.categories
    assert "OTHER" in tax.categories


@pytest.mark.parametrize(
    "skill_in,expected_canonical,expected_cat",
    [
        # Ananya core skills
        ("C++", "C++", "COD"),
        ("Python", "Python", "COD"),
        ("Java", "Java", "COD"),
        ("Data Structures & Algorithms", "Data Structures & Algorithms", "DSA"),
        ("Operating Systems", "Operating Systems", "OS"),
        ("Computer Networks", "Computer Networks", "NETW"),
        ("Object-Oriented Design", "Object-Oriented Design", "OOD"),
        ("Git", "Git", "SWE"),
        ("Linux", "Linux", "OS"),
        # Karthik core skills
        ("SQL", "SQL", "SQL"),
        ("pandas", "pandas", "OTHER"),
        ("Power BI", "Power BI", "OTHER"),
        ("Excel", "Excel", "OTHER"),
        ("scikit-learn", "scikit-learn", "AI"),
        ("A/B testing", "A/B Testing", "OTHER"),
        # Priya core skills
        ("Networking fundamentals", "Computer Networks", "NETW"),
        ("MS Excel", "Excel", "OTHER"),
        ("ticketing tools", "Ticketing Tools", "OTHER"),
        # Rohan core skills
        ("System Design", "System Design", "SYSD"),
        ("basic Machine Learning", "Machine Learning", "AI"),
        ("Docker", "Docker", "SWE"),
    ],
)
def test_core_skills_normalisation(skill_in, expected_canonical, expected_cat):
    """Test that all core sample skills normalise to canonical names and categories."""
    canonical, cat_code, _ = normalise(skill_in)
    assert canonical == expected_canonical
    assert cat_code == expected_cat


def test_ambiguous_skills_flagged():
    """Verify ambiguous skills like Docker and Statistics are flagged."""
    _, cat_docker, amb_docker = normalise("Docker")
    assert cat_docker == "SWE"
    assert amb_docker is True

    _, cat_stats, amb_stats = normalise("Statistics")
    assert cat_stats == "OTHER"
    assert amb_stats is True


def test_fuzzy_matching_aliases():
    """Verify fuzzy aliases like cpp, sklearn, and oop map accurately."""
    c1, cat1, _ = normalise("cpp")
    assert c1 == "C++"
    assert cat1 == "COD"

    c2, cat2, _ = normalise("sklearn")
    assert c2 == "scikit-learn"
    assert cat2 == "AI"

    c3, cat3, _ = normalise("oop")
    assert c3 == "Object-Oriented Design"
    assert cat3 == "OOD"


def test_unknown_skill_fallback():
    """Verify unknown skill is kept as-is and categorized under OTHER."""
    c, cat, amb = normalise("ObscureCustomFramework123")
    assert c == "ObscureCustomFramework123"
    assert cat == "OTHER"
    assert amb is False


@pytest.mark.parametrize(
    "phrase,expected_canonical,expected_category",
    [
        ("multithreaded", "Process Scheduling", "OS"),
        ("multithreading", "Process Scheduling", "OS"),
        ("concurrency", "Process Scheduling", "OS"),
        ("rate limiter", "Testing", "SWE"),
        ("rate limiting", "Testing", "SWE"),
        ("presenting results to a non-technical audience", "Presenting", "COMM"),
    ],
)
def test_generic_phrase_aliases(phrase, expected_canonical, expected_category):
    canonical, category, _ = normalise(phrase)
    assert canonical == expected_canonical
    assert category == expected_category


def test_api_layer_is_not_rest_alias():
    canonical, category, _ = normalise("API layer")
    assert canonical != "REST APIs"
    assert category != "NETW"


def test_p4_coursework_source_kind_is_supported():
    from resume_parser.postprocess import infer_source_kind

    assert infer_source_kind("education", "Data Structures", "coursework") == "coursework"
