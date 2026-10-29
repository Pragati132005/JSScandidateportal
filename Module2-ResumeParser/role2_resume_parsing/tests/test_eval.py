"""Tests verifying that eval/eval.py and eval/fit_sanity.py pass all quality gates."""

from eval.eval import run_eval
from eval.fit_sanity import run_fit_sanity


def test_eval_quality_gates():
    """Verify that automated evaluation harness passes 100% of quality gates."""
    eval_result = run_eval()
    assert eval_result["passed"] is True

    # Assert 100% schema validity and 0 forbidden violations across all rows
    for row in eval_result["results"]:
        assert row["status"] == "PASS"
        assert row["forbidden_violations"] == 0
        assert row["headline_leaks"] == 0
        assert row["placeholder_leaks"] == 0
        assert row["core_recall"] == "100.0%"

    for srow in eval_result["stability"]:
        assert srow["status"] == "PASS"
        assert srow["jaccard_similarity"] == "100.0%"


def test_fit_sanity_ordering():
    """Verify relative fit matrix matches expected candidate roles."""
    matrix = run_fit_sanity()
    assert matrix["Ananya Rao"]["Google SWE"] > matrix["Ananya Rao"]["Google Data Scientist"]
    assert matrix["Karthik Subramaniam"]["Google Data Scientist"] > matrix["Karthik Subramaniam"]["Google SWE"]
    assert matrix["Priya Menon"]["Oracle App Support"] >= matrix["Priya Menon"]["Google SWE"]
    assert matrix["Rohan Verma"]["Google SWE"] >= 0.75
