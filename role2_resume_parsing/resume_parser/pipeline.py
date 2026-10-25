"""Full end-to-end execution pipeline for Resume Parsing (Role 2).

Integrates:
Ingest -> Clean -> Segment -> Extract (LLM + Dictionary Fallback) -> Fuse -> Postprocess -> Prefill -> ResumeParseResult
"""

import os
import time
from typing import Optional

from contract.schema import ParserMeta, ResumeParseResult
from resume_parser.dictionary import parse_resume_dictionary
from resume_parser.extract import extract_resume_raw
from resume_parser.fuse import choose_name_candidate, fuse_extractions
from resume_parser.postprocess import postprocess_skills
from resume_parser.prefill import build_prefill_and_details
from resume_parser.segment import segment_resume
from shared.clean import clean_text
from shared.ingest import extract_text
from shared.llm_client import LLMClient


def parse_resume(
    path: str,
    *,
    use_llm: bool = True,
    client: Optional[LLMClient] = None,
) -> ResumeParseResult:
    """Parse a resume file (PDF or DOCX) into schema-valid ResumeParseResult.

    Args:
        path: Filepath to resume document.
        use_llm: Whether to invoke LLM extraction (rule-based fallback used if False or on failure).
        client: Optional custom LLMClient instance.

    Returns:
        Fully grounded, post-processed ResumeParseResult instance.
    """
    start_time = time.time()
    source_filename = os.path.basename(path)
    all_warnings = []

    # 1. Ingest
    ingest_res = extract_text(path)
    all_warnings.extend(ingest_res.warnings)

    # 2. Clean
    clean_res = clean_text(ingest_res.text)

    # 3. Segment
    seg_res = segment_resume(clean_res.text)
    all_warnings.extend(seg_res.warnings)

    # 4. Rule-based dictionary parsing (always available as zero-cost baseline)
    dict_raw = parse_resume_dictionary(
        clean_res.text,
        seg_res,
        candidate_name=ingest_res.candidate_name,
    )

    model_used = "rule-based-dictionary"
    from_cache = False
    prompt_version = "none"
    merged_raw = dict_raw

    # 5. LLM extraction & fusion (if enabled)
    if use_llm:
        if client is None:
            client = LLMClient()
        try:
            extract_result = extract_resume_raw(
                cleaned_text=clean_res.text,
                segment_result=seg_res,
                client=client,
            )
            llm_raw = extract_result.get("raw_extraction", {})
            meta_info = extract_result.get("meta", {})
            all_warnings.extend(meta_info.get("warnings", []))
            model_used = meta_info.get("model_used", "unknown")
            from_cache = meta_info.get("from_cache", False)
            prompt_version = meta_info.get("prompt_version", "p4")

            # Consensus fusion
            merged_raw = fuse_extractions(llm_raw, dict_raw)
        except Exception as e:
            all_warnings.append(f"LLM extraction failed ({e}); fell back to rule-based dictionary parser.")
            merged_raw = dict_raw
            model_used = "rule-based-fallback"
    else:
        all_warnings.append("LLM disabled; rule-based dictionary parser used.")

    merged_name = choose_name_candidate(
        candidates=[
            merged_raw.get("name"),
            dict_raw.get("name"),
            ingest_res.candidate_name,
            seg_res.candidate_name,
        ],
        email=merged_raw.get("email") or dict_raw.get("email"),
    )
    if merged_name:
        merged_raw["name"] = merged_name

    # 6. Postprocess skills, evidence grounding, taxonomy overrides
    raw_skills = merged_raw.get("skills", [])
    processed_skills, categories_without_ev, postprocess_warnings, dropped_skills = postprocess_skills(
        raw_skills=raw_skills,
        cleaned_text=clean_res.text,
        non_evidence_lines=seg_res.non_evidence_lines,
    )
    all_warnings.extend(postprocess_warnings)

    # Candidate name fallback
    if not merged_raw.get("name"):
        merged_raw["name"] = ingest_res.candidate_name or seg_res.candidate_name

    # 7. Contact check warnings
    if not merged_raw.get("email"):
        all_warnings.append("No email address listed in resume.")
    if not merged_raw.get("phone"):
        all_warnings.append("No phone number listed in resume.")

    # 8. Prefill and Details assembly
    profile_prefill, details = build_prefill_and_details(
        raw_dict=merged_raw,
        skills=processed_skills,
        source_filename=source_filename,
        sections=seg_res.sections,
        warnings=all_warnings,
    )

    # 9. Tier 2: Category Rollup Summary & Gap Detection
    from resume_parser.summary import generate_category_summary
    cat_summary, categories_without_ev, suggested_additions = generate_category_summary(
        profile_prefill.skills
    )

    elapsed_ms = int((time.time() - start_time) * 1000)

    # 10. Assemble Meta audit record
    field_conf = {
        "name": "high" if profile_prefill.name else "none",
        "email": "high" if profile_prefill.email else "none",
        "education": "high" if profile_prefill.education else "none",
        "skills": "high" if processed_skills else "none",
    }

    meta = ParserMeta(
        parser_version="1.3",
        prompt_version=prompt_version,
        taxonomy_version="v1",
        model_used=model_used,
        from_cache=from_cache,
        input_format=ingest_res.input_format,
        parse_warnings=all_warnings,
        dropped_skills=dropped_skills,
        categories_without_evidence=categories_without_ev,
        suggested_manual_additions=suggested_additions,
        field_confidence=field_conf,
        processing_ms=elapsed_ms,
    )

    # 11. Top-level contract result
    result = ResumeParseResult(
        schema_version="1.3",
        source_type="resume",
        source_file=source_filename,
        company=None,
        role=None,
        skills=profile_prefill.skills,
        profile_prefill=profile_prefill,
        details=details,
        category_summary=cat_summary,
        meta=meta,
    )

    return result
