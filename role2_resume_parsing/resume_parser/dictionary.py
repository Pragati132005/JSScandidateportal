"""Rule-based dictionary parser for zero-LLM fallback.

Scans document sections for taxonomy canonicals and aliases with word-boundary
awareness, extracts regex-based contact info, and structures resume fields.
"""

import re
from typing import Any, Dict, List, Set
from resume_parser.postprocess import infer_source_kind
from resume_parser.segment import SegmentResult
from shared.taxonomy import SkillTaxonomy


EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})")
URL_REGEX = re.compile(r"https?://[^\s]+|github\.com/[^\s]+|linkedin\.com/in/[^\s]+")
DEGREE_START_PATTERN = re.compile(
    r"(?:B\.?\s*S\.?|M\.?\s*S\.?|B\.?\s*Tech\.?|M\.?\s*Tech\.?|"
    r"BCA|MCA|Ph\.?\s*D\.?|Bachelor(?:'s)?|Master(?:'s)?|"
    r"Associate(?:'s)?|Doctor(?:ate)?|Degree)",
    re.I,
)


def _parse_degree_line(line: str) -> tuple[str | None, str | None]:
    """Keep the resume's degree wording and split an optional field after `in`."""
    match = DEGREE_START_PATTERN.search(line)
    if not match:
        return None, None

    degree_text = line[match.start():].strip(" \t:-|")
    field = None
    in_match = re.search(r"\s+in\s+", degree_text, re.I)
    if in_match:
        degree_text, field = (
            degree_text[:in_match.start()].strip(),
            degree_text[in_match.end():].strip(" \t:-|"),
        )
    else:
        matched_text = match.group(0)
        remainder = line[match.end():].strip(" \t:-|")
        qualifier_match = re.match(r"((?:of\s+\S+)|(?:degree))\b", remainder, re.I)
        if qualifier_match:
            degree_text = f"{matched_text} {qualifier_match.group(1)}"
            field = remainder[qualifier_match.end():].strip(" \t:-|") or None
        elif re.match(r"(?:B|M)\.?\s*(?:S|Tech)\.?\b", matched_text, re.I):
            degree_text = matched_text
            field = remainder or None
    return degree_text or None, field or None


def _finalize_education_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """Remove parser-only state and combine wrapped field lines."""
    field_parts = entry.pop("_field_parts", [])
    if entry.get("field") is None and field_parts:
        entry["field"] = " ".join(field_parts)
    return entry


def build_skill_patterns() -> List[Dict[str, Any]]:
    """Compile word-boundary regex patterns for all taxonomy skills and aliases."""
    tax = SkillTaxonomy.get_instance()
    patterns = []

    for item in tax.skills:
        canonical = item["canonical"]
        cat_code = item["category_code"]
        aliases = [canonical] + item.get("aliases", [])

        # Build regex with word boundaries
        regex_parts = []
        for a in aliases:
            escaped = re.escape(a.strip())
            # Handle C++ specially
            if a.lower() == "c++":
                regex_parts.append(r"(?:\bc\+\+|\bcpp\b)")
            elif a.lower() == "c":
                regex_parts.append(r"\bC\b")
            elif a.lower() in ["testing", "tests", "test"]:
                # Ensure software testing does not match A/B testing
                regex_parts.append(rf"(?<!a/b\s)(?<!ab\s)(?<!a/b-)(?<!split\s)\b{escaped}\b")
            else:
                regex_parts.append(rf"\b{escaped}\b")

        combined_regex = re.compile("|".join(regex_parts), re.IGNORECASE)
        patterns.append({
            "canonical": canonical,
            "category_code": cat_code,
            "regex": combined_regex,
        })

    return patterns


def parse_resume_dictionary(
    cleaned_text: str,
    segment_result: SegmentResult,
    candidate_name: str | None = None,
) -> Dict[str, Any]:
    """Extract resume fields using rule-based and taxonomy dictionary matching.

    Args:
        cleaned_text: Cleaned text of the resume.
        segment_result: Output from segment_resume().

    Returns:
        Dictionary structured like raw LLM extraction for seamless downstream fusion.
    """
    patterns = build_skill_patterns()
    extracted_skills: List[Dict[str, Any]] = []
    seen_canonicals: Set[str] = set()

    # 1. Scan Skills Section (High confidence)
    skills_sec = segment_result.sections.get("skills", "")
    for line in skills_sec.splitlines():
        line_clean = line.strip()
        if not line_clean:
            continue
        for p in patterns:
            if p["regex"].search(line_clean):
                canonical = p["canonical"]
                if canonical not in seen_canonicals:
                    seen_canonicals.add(canonical)
                    extracted_skills.append({
                        "skill_name": canonical,
                        "category_code": p["category_code"],
                        "evidence": line_clean[:120],
                        "confidence": "high",
                        "source_section": "technical_skills",
                        "source_kind": "skills_list",
                    })

    # 2. Scan All Other Sections (including unsegmented or unknown headings)
    for sec_name, sec_text in segment_result.sections.items():
        if sec_name == "skills":
            continue
        conf_tier = "high" if "competenc" in sec_name or "skill" in sec_name else "medium"
        for line in sec_text.splitlines():
            line_clean = line.strip()
            if not line_clean:
                continue
            for p in patterns:
                if p["regex"].search(line_clean):
                    canonical = p["canonical"]
                    if canonical not in seen_canonicals:
                        seen_canonicals.add(canonical)
                        extracted_skills.append({
                            "skill_name": canonical,
                            "category_code": p["category_code"],
                            "evidence": line_clean[:120],
                        "confidence": conf_tier,
                        "source_section": sec_name,
                        "source_kind": "coursework" if sec_name == "education" else infer_source_kind(sec_name, line_clean),
                        })

    # 3. Regex contact extraction
    emails = EMAIL_REGEX.findall(cleaned_text)
    phones = PHONE_REGEX.findall(cleaned_text)
    links = URL_REGEX.findall(cleaned_text)

    # 4. Education extraction
    edu_lines = [line.strip() for line in segment_result.sections.get("education", "").splitlines() if line.strip()]
    education_entries = []
    current_entry = None
    for eline_clean in edu_lines:
        degree, inline_field = _parse_degree_line(eline_clean)
        if degree:
            if current_entry and any(value is not None for value in current_entry.values()):
                education_entries.append(_finalize_education_entry(current_entry))
            current_entry = {
                "degree": degree,
                "field": inline_field,
                "institution": None,
                "graduation_year": None,
                "grade": None,
                "grade_scale": None,
                "_field_parts": [],
            }

        if current_entry is None:
            continue

        lowered = eline_clean.lower()
        if current_entry["institution"] is None and re.search(
            r"\b(?:university|college|institute|school)\b", eline_clean, re.I
        ):
            current_entry["institution"] = eline_clean

        if (
            current_entry["field"] is None
            and current_entry["institution"] is None
            and not degree
            and not re.search(r"\b(?:19|20)\d{2}\b", eline_clean)
            and not re.search(r"\b(?:GPA|CGPA)\b", eline_clean, re.I)
        ):
            current_entry["_field_parts"].append(eline_clean)

        year_matches = re.findall(r"\b(?:19|20)\d{2}\b", eline_clean)
        if year_matches:
            current_entry["graduation_year"] = int(year_matches[-1])

        grade_match = re.search(
            r"\b(CGPA|GPA)\s*[:=]?\s*([0-9]+(?:\.\d+)?(?:\s*/\s*[0-9]+)?)",
            eline_clean,
            re.I,
        )
        if grade_match:
            current_entry["grade"] = grade_match.group(2)
            current_entry["grade_scale"] = grade_match.group(1).upper()

    if current_entry and any(value is not None for value in current_entry.values()):
        education_entries.append(_finalize_education_entry(current_entry))

    # 5. Projects
    project_entries = []
    for line in segment_result.sections.get("projects", "").splitlines():
        line_clean = line.strip(" •\t-")
        if line_clean and len(line_clean) > 15:
            title = line_clean.split("—")[0].split("(")[0].strip()
            project_entries.append({
                "title": title[:50],
                "description": line_clean,
                "technologies": [],
            })

    # 6. Hackathons and Internships
    hackathon_entries = []
    internship_entries = []
    hack_intern_lines = segment_result.sections.get("hackathons_internships", "").splitlines()
    for line in hack_intern_lines:
        line_clean = line.strip(" •\t-")
        if not line_clean:
            continue
        lowered = line_clean.lower()
        if "intern" in lowered:
            internship_entries.append({
                "role": line_clean.split("—")[0].strip(),
                "organization": None,
                "description": line_clean,
            })
        else:
            result_label = None
            if "winner" in lowered:
                result_label = "Winner"
            elif "finalist" in lowered:
                result_label = "Finalist"
            elif "runner-up" in lowered or "runner up" in lowered:
                result_label = "Runner-up"
            elif "participated" in lowered:
                result_label = "Participant"
            hackathon_entries.append({
                "title": line_clean.split("—")[0].strip(),
                "result": result_label,
                "kind": "hackathon" if "hackathon" in lowered else "competition",
                "description": line_clean,
            })

    # 7. Certifications
    cert_lines = [
        line.strip(" •\t-")
        for line in segment_result.sections.get("certifications", "").splitlines()
        if line.strip(" •\t-")
    ]

    # 8. Achievements
    achieve_lines = [
        line.strip(" •\t-")
        for line in segment_result.sections.get("achievements", "").splitlines()
        if line.strip(" •\t-")
    ]

    # 9. Preferred roles
    roles_text = segment_result.sections.get("preferred_roles", "")
    roles = [r.strip() for r in roles_text.replace("\n", ",").split(",") if r.strip()]

    return {
        "name": candidate_name or segment_result.candidate_name,
        "email": emails[0] if emails else None,
        "phone": phones[0] if phones else None,
        "links": links,
        "education": education_entries,
        "skills": extracted_skills,
        "projects": project_entries,
        "experience": internship_entries,
        "hackathons": hackathon_entries,
        "internships": internship_entries,
        "certifications": cert_lines,
        "achievements": achieve_lines,
        "preferred_roles": roles,
    }
