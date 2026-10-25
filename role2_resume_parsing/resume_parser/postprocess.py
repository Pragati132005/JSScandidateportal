"""Post-processing module for evidence grounding, taxonomy overrides, and deduplication.

Enforces:
1. Strict evidence grounding against cleaned text.
2. Complete exclusion of headline/fit-label as evidence.
3. Deterministic taxonomy canonicalization and category override.
4. Confidence ranking and deduplication.
5. Rejection of placeholder text (e.g. "None listed", "N/A").
6. Detection of the 12 RADIX categories without evidence.
"""

import re
from typing import Any, Dict, List, Optional, Set, Tuple
from rapidfuzz import fuzz
from shared.taxonomy import normalise

RADIX_12_CATEGORIES = [
    "COD", "DSA", "OOD", "APTI", "COMM", "AI",
    "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS"
]

CONFIDENCE_RANK = {"high": 3, "medium": 2, "low": 1}

SOURCE_KINDS = {
    "skills_list",
    "project",
    "internship",
    "certification",
    "achievement",
    "experience",
    "coursework",
    "unknown",
}


def infer_source_kind(
    source_section: Optional[str],
    evidence: str = "",
    explicit_source_kind: Optional[str] = None,
) -> str:
    """Return a stable semantic origin for a skill signal."""
    explicit = (explicit_source_kind or "").strip().lower().replace(" ", "_")
    if explicit in SOURCE_KINDS:
        return explicit
    if explicit in {"skills", "skill", "technical_skills", "technical"}:
        return "skills_list"
    if explicit in {"projects", "project_work"}:
        return "project"
    if explicit in {"intern", "internship", "work"}:
        return "internship"
    if explicit in {"certifications", "certificate", "cert"}:
        return "certification"
    if explicit in {"course", "courses", "coursework", "education_coursework"}:
        return "coursework"
    if explicit in {"achievements", "hackathon", "competition"}:
        return "achievement"

    section = (source_section or "").strip().lower().replace(" ", "_")
    if "skill" in section or "competenc" in section or "stack" in section:
        return "skills_list"
    if "project" in section:
        return "project"
    if section in {"education", "academic_background", "academics"}:
        return "coursework"
    if "intern" in section:
        return "internship"
    if "experience" in section or "work" in section:
        return "experience"
    if "certif" in section or "course" in section:
        return "certification"
    if "achievement" in section or "hackathon" in section or "competition" in section:
        return "achievement"
    if evidence and "intern" in evidence.lower():
        return "internship"
    return "unknown"

PLACEHOLDER_PATTERNS = [
    re.compile(r"^\s*none(\s+listed)?\s*$", re.IGNORECASE),
    re.compile(r"^\s*n/?a\s*$", re.IGNORECASE),
    re.compile(r"^\s*nil\s*$", re.IGNORECASE),
    re.compile(r"^\s*not\s+applicable\s*$", re.IGNORECASE),
    re.compile(r".*no\s+formal\s+certifications.*", re.IGNORECASE),
    re.compile(r".*self-taught.*no\s+formal.*", re.IGNORECASE),
]

LEADING_BULLET_PATTERN = re.compile(
    r"^\s*(?:(?:â€¢|•|Â·|·|â—|â—‹|â– |â–ª|âž¢)|\*|-\s+)+\s*"
)


def strip_leading_bullets(text: str) -> str:
    """Remove presentation bullets from evidence while preserving its words."""
    return LEADING_BULLET_PATTERN.sub("", text).strip()


def is_placeholder(text: str) -> bool:
    """Check if string is placeholder text that must not become data."""
    if not text or not text.strip():
        return True
    s = text.strip()
    return any(p.match(s) for p in PLACEHOLDER_PATTERNS)


def normalize_whitespace(text: str) -> str:
    """Normalize internal spacing and newlines for fuzzy matching."""
    return " ".join(text.split()).lower()


def verify_evidence_grounding(
    evidence: str,
    cleaned_text: str,
    non_evidence_lines: Optional[List[str]] = None,
    threshold: float = 85.0,
) -> bool:
    """Check if evidence quote appears in the cleaned source text.

    Also ensures evidence does not come from non-evidence lines (e.g. fit label).
    """
    if not evidence or not evidence.strip():
        return False

    ev_norm = normalize_whitespace(evidence)
    src_norm = normalize_whitespace(cleaned_text)

    # 1. Reject if evidence comes from non-evidence / fit label
    if non_evidence_lines:
        for ne in non_evidence_lines:
            ne_norm = normalize_whitespace(ne)
            if ev_norm in ne_norm or fuzz.partial_ratio(ev_norm, ne_norm) > 90:
                return False

    # 2. Check exact substring
    if ev_norm in src_norm:
        return True

    # 3. Check fuzzy partial ratio
    score = fuzz.partial_ratio(ev_norm, src_norm)
    return score >= threshold


def postprocess_skills(
    raw_skills: List[Dict[str, Any]],
    cleaned_text: str,
    non_evidence_lines: Optional[List[str]] = None,
) -> Tuple[List[Dict[str, Any]], List[str], List[str], List[Dict[str, str]]]:
    """Clean, ground, override taxonomy, and deduplicate skills.

    Returns:
        (processed_skills, categories_without_evidence, warnings, dropped_skills)
    """
    warnings: List[str] = []
    dropped_skills: List[Dict[str, str]] = []
    skill_map: Dict[str, Dict[str, Any]] = {}
    src_norm = normalize_whitespace(cleaned_text)

    for index, item in enumerate(raw_skills if isinstance(raw_skills, list) else []):
        if not isinstance(item, dict):
            warnings.append(f"Dropped invalid skill item at index {index}: item must be an object")
            continue
        raw_name_value = item.get("skill_name", "")
        raw_name = raw_name_value.strip() if isinstance(raw_name_value, str) else ""
        if not raw_name or is_placeholder(raw_name):
            continue

        raw_evidence_value = item.get("evidence", "")
        raw_evidence = strip_leading_bullets(
            raw_evidence_value if isinstance(raw_evidence_value, str) else ""
        )
        raw_conf = str(item.get("confidence", "low")).lower()
        if raw_conf not in CONFIDENCE_RANK:
            raw_conf = "low"
        source_sec = item.get("source_section")
        source_kind = infer_source_kind(
            source_section=source_sec,
            evidence=raw_evidence,
            explicit_source_kind=item.get("source_kind"),
        )

        # 1. Evidence Grounding Check
        evidence_verified = verify_evidence_grounding(
            evidence=raw_evidence,
            cleaned_text=cleaned_text,
            non_evidence_lines=non_evidence_lines,
        )

        # Check if skill name itself appears in source
        skill_in_source = normalize_whitespace(raw_name) in src_norm

        if not evidence_verified:
            if not skill_in_source:
                # Neither evidence nor skill name appears in source -> Hallucination, drop
                reason = "claimed evidence is not grounded in the resume and the skill name is absent"
                warnings.append(f"Dropped unsupported skill: '{raw_name}'")
                dropped_skills.append({
                    "skill_name": raw_name,
                    "claimed_evidence": raw_evidence,
                    "reason": reason,
                })
                continue
            else:
                # Skill name in source but evidence unverified -> Downgrade confidence
                raw_conf = "low"
                evidence_verified = False

        # 2. Taxonomy Override
        canonical, category_code, is_ambiguous = normalise(raw_name)

        processed_entry = {
            "skill_name": canonical,
            "category_code": category_code,
            "evidence": raw_evidence,
            "confidence": raw_conf,
            "evidence_verified": evidence_verified,
            "source_section": source_sec,
            "source_kind": source_kind,
        }

        # 3. Deduplication (keep strongest confidence and richest evidence)
        key = canonical.lower()
        if key in skill_map:
            existing = skill_map[key]
            existing_rank = CONFIDENCE_RANK.get(existing["confidence"], 1)
            new_rank = CONFIDENCE_RANK.get(raw_conf, 1)

            if new_rank > existing_rank:
                skill_map[key] = processed_entry
            elif new_rank == existing_rank and len(raw_evidence) > len(existing["evidence"]):
                skill_map[key] = processed_entry
        else:
            skill_map[key] = processed_entry

    final_skills = list(skill_map.values())

    # 4. Compute 12 RADIX categories without evidence
    present_categories: Set[str] = {s["category_code"] for s in final_skills}
    categories_without_evidence = [
        c for c in RADIX_12_CATEGORIES if c not in present_categories
    ]

    return final_skills, categories_without_evidence, warnings, dropped_skills


def postprocess_certifications(raw_certs: List[str]) -> List[str]:
    """Filter out placeholder certifications."""
    cleaned = []
    for cert in raw_certs:
        if cert and not is_placeholder(cert):
            cleaned.append(cert.strip())
    return cleaned
