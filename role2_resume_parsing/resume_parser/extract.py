"""Raw LLM resume extraction module.

Coordinates prompt assembly, client invocation, repair loops, and raw schema parsing.
"""

from typing import Any, Dict, Optional
from resume_parser.prompts import (
    PROMPT_VERSION,
    SYSTEM_PROMPT_P4,
    build_user_prompt,
)
from resume_parser.segment import SegmentResult
from shared.cache import compute_replay_key
from shared.llm_client import LLMClient, LLMResponse


def extract_resume_raw(
    cleaned_text: str,
    segment_result: SegmentResult,
    client: Optional[LLMClient] = None,
    cache_key_override: Optional[str] = None,
) -> Dict[str, Any]:
    """Execute LLM extraction on segmented resume text.

    Args:
        cleaned_text: Preprocessed resume text.
        segment_result: Output from segment_resume().
        client: Optional LLMClient instance (defaults to environment settings).
        cache_key_override: Optional explicit cache key.

    Returns:
        Raw dictionary containing LLM extracted fields along with extraction metadata.
    """
    if client is None:
        client = LLMClient()

    user_prompt = build_user_prompt(
        cleaned_text=cleaned_text,
        sections=segment_result.sections,
        non_evidence=segment_result.non_evidence_lines,
    )

    response: LLMResponse = client.generate(
        system_prompt=SYSTEM_PROMPT_P4,
        user_prompt=user_prompt,
        prompt_version=PROMPT_VERSION,
        cache_key_override=cache_key_override,
        replay_key_override=compute_replay_key(cleaned_text, PROMPT_VERSION),
    )

    extracted_dict = dict(response.parsed_json or {})
    if not extracted_dict.get("name") and segment_result.candidate_name:
        extracted_dict["name"] = segment_result.candidate_name

    # Attach LLM audit metadata
    raw_result = {
        "raw_extraction": extracted_dict,
        "meta": {
            "prompt_version": PROMPT_VERSION,
            "model_used": response.model_used,
            "provider_used": response.provider_used,
            "from_cache": response.from_cache,
            "latency_ms": response.latency_ms,
            "warnings": list(response.warnings),
        },
    }

    return raw_result
