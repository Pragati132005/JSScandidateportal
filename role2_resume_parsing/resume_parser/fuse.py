"""Skill and extraction fusion between LLM predictions and rule-based dictionary matches.

Implements consensus-based confidence elevation, keeps dictionary discoveries,
and ensures unverified LLM skills are pruned.
"""

import re
from typing import Any, Dict, List, Optional, Sequence
from resume_parser.postprocess import infer_source_kind
from shared.taxonomy import normalise

CONFIDENCE_ORDER = ["low", "medium", "high"]

NAME_SECTION_HEADINGS = {
    "education", "skills", "technical skills", "experience", "work experience",
    "projects", "certifications", "achievements", "internships", "hackathons",
    "hackathons / internships", "preferred roles", "objective", "summary",
}
NAME_JOB_TITLE_WORDS = {
    "administrator", "analyst", "architect", "computer", "consultant", "coordinator", "creator",
    "designer", "developer", "engineer", "intern", "lead", "manager", "scientist",
    "specialist", "student", "support", "technician", "trainee",
}
NAME_TOKEN_PATTERN = re.compile(r"[A-Za-z][A-Za-z'’-]*\.?")


def _valid_name_candidate(candidate: Any) -> Optional[tuple[str, List[str]]]:
    """Validate and tokenize a possible name without changing its spelling."""
    if not isinstance(candidate, str):
        return None
    value = " ".join(candidate.strip().split())
    if not value or any(character.isdigit() for character in value):
        return None
    normalized_heading = re.sub(r"[^a-z /]+", "", value.lower()).strip()
    if normalized_heading in NAME_SECTION_HEADINGS:
        return None
    tokens = value.split()
    if not 1 <= len(tokens) <= 4:
        return None
    if any(NAME_TOKEN_PATTERN.fullmatch(token) is None for token in tokens):
        return None
    if any(token.rstrip(".").lower() in NAME_JOB_TITLE_WORDS for token in tokens):
        return None
    return value, [token.rstrip(".").lower() for token in tokens]


def _email_supports_name(tokens: Sequence[str], email: Optional[str]) -> bool:
    """Check that email name components are represented by candidate tokens."""
    if not email or "@" not in email:
        return True
    local_parts = [part for part in re.split(r"[^a-z]+", email.split("@", 1)[0].lower()) if part]
    if not local_parts:
        return True
    long_parts = [part for part in local_parts if len(part) > 1]
    if long_parts and not all(
        part in tokens or part in "".join(tokens) for part in long_parts
    ):
        return False
    initials = [part for part in local_parts if len(part) == 1]
    return all(any(token.startswith(initial) for token in tokens) for initial in initials)


def choose_name_candidate(
    candidates: Sequence[Any],
    email: Optional[str] = None,
) -> Optional[str]:
    """Choose the longest valid, email-consistent name from extraction sources."""
    valid = []
    seen = set()
    for candidate in candidates:
        parsed = _valid_name_candidate(candidate)
        if parsed and parsed[0].lower() not in seen:
            valid.append(parsed)
            seen.add(parsed[0].lower())
    if not valid:
        return None

    consistent = [item for item in valid if _email_supports_name(item[1], email)]
    pool = consistent or valid
    for value, tokens in sorted(pool, key=lambda item: len(item[1]), reverse=True):
        token_set = set(tokens)
        shorter_candidates = [other_tokens for _, other_tokens in pool if len(other_tokens) < len(tokens)]
        if all(set(other_tokens).issubset(token_set) for other_tokens in shorter_candidates):
            return value
    return max(pool, key=lambda item: len(item[1]))[0]


def elevate_confidence(current: str) -> str:
    """Elevate confidence by one tier upon consensus agreement."""
    c = current.lower()
    if c == "low":
        return "medium"
    elif c == "medium":
        return "high"
    return "high"


def fuse_skills(
    llm_skills: List[Dict[str, Any]],
    dict_skills: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Fuse skill lists from LLM and dictionary parser.

    Rules:
    - If both agree on canonical skill: elevate confidence by one tier.
    - Dictionary-only skills are retained.
    - LLM-only skills are retained only if they have verified evidence or valid text.
    """
    fused_map: Dict[str, Dict[str, Any]] = {}

    # Index dictionary skills by canonical name
    dict_map: Dict[str, Dict[str, Any]] = {}
    for ds in dict_skills:
        if not isinstance(ds, dict) or not isinstance(ds.get("skill_name"), str):
            continue
        c_name, cat, _ = normalise(ds.get("skill_name", ""))
        dict_evidence = ds.get("evidence") if isinstance(ds.get("evidence"), str) else ""
        key = c_name.lower()
        dict_map[key] = {
            "skill_name": c_name,
            "category_code": cat,
            "evidence": dict_evidence,
            "confidence": ds.get("confidence", "medium"),
            "evidence_verified": True,
            "source_section": ds.get("source_section", "skills"),
            "source_kind": infer_source_kind(
                ds.get("source_section"), dict_evidence, ds.get("source_kind")
            ),
        }

    # Process LLM skills
    for ls in llm_skills if isinstance(llm_skills, list) else []:
        if not isinstance(ls, dict):
            continue
        skill_name = ls.get("skill_name")
        if not isinstance(skill_name, str) or not skill_name.strip():
            continue
        c_name, cat, _ = normalise(skill_name)
        key = c_name.lower()
        llm_conf_value = ls.get("confidence", "low")
        llm_conf = llm_conf_value.lower() if isinstance(llm_conf_value, str) else "low"
        evidence_verified = ls.get("evidence_verified", True)
        llm_evidence = ls.get("evidence") if isinstance(ls.get("evidence"), str) else ""

        if key in dict_map:
            # Consensus: both LLM and dictionary identified the skill!
            # Elevate confidence one level
            consensus_conf = elevate_confidence(max(llm_conf, dict_map[key]["confidence"]))
            fused_map[key] = {
                "skill_name": c_name,
                "category_code": cat,
                "evidence": llm_evidence or dict_map[key]["evidence"],
                "confidence": consensus_conf,
                "evidence_verified": evidence_verified,
                "source_section": ls.get("source_section") or dict_map[key]["source_section"],
                "source_kind": infer_source_kind(
                    ls.get("source_section") or dict_map[key]["source_section"],
                    llm_evidence or dict_map[key]["evidence"],
                    ls.get("source_kind") or dict_map[key]["source_kind"],
                ),
            }
        else:
            # LLM only
            fused_map[key] = {
                "skill_name": c_name,
                "category_code": cat,
                "evidence": llm_evidence,
                "confidence": llm_conf,
                "evidence_verified": evidence_verified,
                "source_section": ls.get("source_section"),
                "source_kind": infer_source_kind(
                    ls.get("source_section"), llm_evidence, ls.get("source_kind")
                ),
            }

    # Add remaining dictionary skills
    for key, ds in dict_map.items():
        if key not in fused_map:
            fused_map[key] = ds

    return list(fused_map.values())


def fuse_extractions(
    llm_raw: Optional[Dict[str, Any]],
    dict_raw: Dict[str, Any],
) -> Dict[str, Any]:
    """Fuse full extraction outputs from LLM and dictionary parsing."""
    if not llm_raw:
        # LLM not available -> return dictionary extraction directly
        return dict_raw

    # Fuse skills
    fused_skills = fuse_skills(
        llm_skills=llm_raw.get("skills", []) if isinstance(llm_raw, dict) else [],
        dict_skills=dict_raw.get("skills", []) if isinstance(dict_raw, dict) else [],
    )

    merged = dict(llm_raw)
    merged["skills"] = fused_skills

    # Fallback to dictionary values if LLM produced empty/null for key fields
    if not merged.get("name") and dict_raw.get("name"):
        merged["name"] = dict_raw["name"]

    if not merged.get("email") and dict_raw.get("email"):
        merged["email"] = dict_raw["email"]

    if not merged.get("phone") and dict_raw.get("phone"):
        merged["phone"] = dict_raw["phone"]

    if not merged.get("links") and dict_raw.get("links"):
        merged["links"] = dict_raw["links"]

    if not merged.get("education") and dict_raw.get("education"):
        merged["education"] = dict_raw["education"]

    if not merged.get("preferred_roles") and dict_raw.get("preferred_roles"):
        merged["preferred_roles"] = dict_raw["preferred_roles"]

    merged_name = choose_name_candidate(
        [llm_raw.get("name"), dict_raw.get("name")],
        email=merged.get("email"),
    )
    if merged_name:
        merged["name"] = merged_name

    return merged
