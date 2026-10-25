"""Shared pytest handling for optional organizer-only resume data."""

from pathlib import Path

import pytest


SAMPLE_PACK = Path(__file__).resolve().parents[1] / "data" / "resumes"


def pytest_collection_modifyitems(items):
    """Skip only tests that require the separately supplied sample pack."""
    if SAMPLE_PACK.exists():
        return

    data_dependent = {
        "test_clean_segment.py::test_clean_and_segment_pdf",
        "test_clean_segment.py::test_pdf_docx_equivalence",
        "test_clean_segment.py::test_rohan_pdf_header_footer_removal",
        "test_dictionary_fallback.py::test_zero_llm_parsing_pdf",
        "test_extract.py::test_extract_resume_raw_replay_pdf",
        "test_extract.py::test_extract_resume_raw_replay_docx",
        "test_ingest.py::test_extract_pdf_samples",
        "test_ingest.py::test_extract_docx_samples",
        "test_m14.py::test_pipeline_populates_source_kind",
        "test_packaging.py::test_api_parse_resume_upload",
        "test_packaging.py::test_cli_execution_with_output",
        "test_packaging.py::test_cli_no_llm_flag",
        "test_pipeline.py::test_pipeline_end_to_end_replay",
        "test_pipeline.py::test_pipeline_partial_mock_llm_output_keeps_core_fields",
        "test_prefill.py::test_sample_education_strings_remain_byte_identical",
        "test_prefill.py::test_sample_names_remain_byte_identical",
        "test_summary.py::test_pipeline_category_summary_present",
        "test_summary.py::test_meta_categories_without_evidence",
        "test_summary.py::test_suggested_manual_additions_populated",
        "test_summary.py::test_category_summary_skill_counts_consistent",
        "test_eval.py::test_eval_quality_gates",
        "test_eval.py::test_fit_sanity_ordering",
    }
    reason = "Organizer sample resume pack is not included in the public repository"
    for item in items:
        module_name = Path(item.fspath).name
        base_name = item.name.split("[")[0]
        if f"{module_name}::{base_name}" in data_dependent:
            item.add_marker(pytest.mark.skip(reason=reason))
