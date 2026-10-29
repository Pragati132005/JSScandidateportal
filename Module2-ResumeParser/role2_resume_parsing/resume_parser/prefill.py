"""Assembly of profile prefill and extended candidate details for Role 3."""

import re
from typing import Any, Dict, List, Optional
from pydantic import ValidationError
from contract.schema import (
    Details,
    EducationDetail,
    ExperienceDetail,
    HackathonItem,
    InternshipItem,
    ProfilePrefill,
    ProjectDetail,
    Skill,
)
from resume_parser.postprocess import postprocess_certifications


EDUCATION_LINE_PATTERN = re.compile(
    r"(?:\bB\s*\.\s*S\.?\b|\bB\s*\.\s*Tech\.?\b|\bBachelor(?:'s)?\b|"
    r"\bM\s*\.\s*S\.?\b|\bMaster(?:'s)?\b|\bPh\s*\.?\s*D\.?\b|"
    r"\bDiploma\b|\bUniversity\b|\bCollege\b|\bInstitute\b|\bSchool\b|"
    r"\b(?:19|20)\d{2}\b|\b(?:GPA|CGPA)\b)",
    re.IGNORECASE,
)


def extract_education_summary_string(
    raw_education: Any,
    sections: Optional[Dict[str, str]] = None,
    education_details: Optional[List[Any]] = None,
) -> Optional[str]:
    """Select a grounded education summary for Role 3 profile prefill."""
    selected_line = None
    if sections and "education" in sections:
        lines = [line.strip() for line in sections["education"].splitlines() if line.strip()]
        for line in lines:
            if EDUCATION_LINE_PATTERN.search(line):
                selected_line = line
                break

    detail_items = education_details
    if detail_items is None and isinstance(raw_education, list):
        detail_items = raw_education

    formatted = None
    for item in detail_items or []:
        if isinstance(item, dict):
            get_value = item.get
        else:
            get_value = lambda key: getattr(item, key, None)
        degree = get_value("degree") or ""
        field = get_value("field") or ""
        institution = get_value("institution") or ""
        year = get_value("graduation_year") or ""
        grade = get_value("grade") or ""
        grade_scale = str(get_value("grade_scale") or "").upper()
        grade_label = "CGPA" if "CGPA" in grade_scale else "GPA"
        if not any([degree, field, institution, year, grade]):
            continue
        grade_text = str(grade)
        if grade and "/" not in grade_text and grade_scale and grade_scale not in {"GPA", "CGPA"}:
            grade_text = f"{grade_text} / {grade_scale}"
        core_parts = [
            str(value)
            for value in [
                degree,
                field,
                institution,
                str(year) if year else "",
            ]
            if value
        ]
        if core_parts:
            formatted = ", ".join(core_parts)
            if grade:
                formatted = f"{formatted} — {grade_label} {grade_text}"
            break

    if selected_line:
        normalized = re.sub(r"[\s,;:()\-]+", " ", selected_line).strip()
        degree_only = bool(re.fullmatch(
            r"(?:B\.?\s*S\.?|B\.?\s*Tech\.?|M\.?\s*S\.?|M\.?\s*Tech\.?|"
            r"BCA|MCA|Ph\.?\s*D\.?)",
            normalized,
            re.IGNORECASE,
        ))
        has_year_or_grade = bool(re.search(r"\b(?:19|20)\d{2}\b|\b(?:GPA|CGPA)\b", selected_line, re.IGNORECASE))
        has_institution = bool(re.search(r"\b(?:University|College|Institute|School)\b", selected_line, re.IGNORECASE))
        if len(selected_line) >= 12 and not degree_only and (has_year_or_grade or has_institution):
            return selected_line
        return formatted or selected_line

    return formatted


def partition_hackathons_and_internships(
    raw_hackathons: List[Dict[str, Any]],
    raw_internships: List[Dict[str, Any]],
    sections: Optional[Dict[str, str]] = None,
    warnings: Optional[List[str]] = None,
) -> tuple[List[HackathonItem], List[InternshipItem]]:
    """Partition combined hackathon and internship items cleanly."""
    hackathons: List[HackathonItem] = []
    internships: List[InternshipItem] = []

    def add_warning(label: str, index: int, error: Exception) -> None:
        if warnings is not None:
            warnings.append(f"Dropped invalid {label} item at index {index}: {str(error).splitlines()[0]}")

    def as_text(value: Any) -> Optional[str]:
        return value if isinstance(value, str) else None

    # Process items provided in raw_hackathons
    for index, item in enumerate(raw_hackathons):
        if not isinstance(item, dict):
            add_warning("hackathon", index, TypeError("item must be an object"))
            continue
        title = as_text(item.get("title")) or ""
        desc = as_text(item.get("description")) or ""
        combined_text = f"{title} {desc}".lower()

        if "intern" in combined_text:
            try:
                internships.append(InternshipItem.model_validate({
                    "role": title or None,
                    "organization": as_text(item.get("organization")),
                    "description": desc or None,
                }))
            except (ValidationError, TypeError, ValueError) as error:
                add_warning("internship", index, error)
        else:
            try:
                hackathons.append(HackathonItem.model_validate({
                    "title": title or None,
                    "result": as_text(item.get("result")),
                    "kind": as_text(item.get("kind")) or "hackathon",
                    "description": desc or None,
                }))
            except (ValidationError, TypeError, ValueError) as error:
                add_warning("hackathon", index, error)

    # Process items provided in raw_internships
    for index, item in enumerate(raw_internships):
        if not isinstance(item, dict):
            add_warning("internship", index, TypeError("item must be an object"))
            continue
        role = as_text(item.get("role")) or ""
        desc = as_text(item.get("description")) or ""
        combined_text = f"{role} {desc}".lower()

        if "hackathon" in combined_text or "competition" in combined_text:
            try:
                hackathons.append(HackathonItem.model_validate({
                    "title": role or None,
                    "result": as_text(item.get("result")),
                    "kind": "hackathon" if "hackathon" in combined_text else "competition",
                    "description": desc or None,
                }))
            except (ValidationError, TypeError, ValueError) as error:
                add_warning("hackathon", index, error)
        else:
            try:
                internships.append(InternshipItem.model_validate({
                    "role": role or None,
                    "organization": as_text(item.get("organization")),
                    "description": desc or None,
                }))
            except (ValidationError, TypeError, ValueError) as error:
                add_warning("internship", index, error)

    return hackathons, internships


def _safe_items(value: Any) -> List[Any]:
    return value if isinstance(value, list) else []


def _safe_text(value: Any) -> Optional[str]:
    return value if isinstance(value, str) else None


def _short_project_title(description: Any) -> Optional[str]:
    text = _safe_text(description)
    if not text or not text.strip():
        return None
    words = text.strip().lstrip("-•* ").split()
    return " ".join(words[:6]) or None


def _safe_model(
    model_cls: Any,
    item: Any,
    label: str,
    index: int,
    warnings: Optional[List[str]],
) -> Optional[Any]:
    try:
        return model_cls.model_validate(item)
    except (ValidationError, TypeError, ValueError) as error:
        if warnings is not None:
            warnings.append(f"Dropped invalid {label} item at index {index}: {str(error).splitlines()[0]}")
        return None


def build_prefill_and_details(
    raw_dict: Dict[str, Any],
    skills: List[Dict[str, Any]],
    source_filename: str,
    sections: Optional[Dict[str, str]] = None,
    warnings: Optional[List[str]] = None,
) -> tuple[ProfilePrefill, Details]:
    """Construct validated ProfilePrefill and Details instances."""
    name = _safe_text(raw_dict.get("name"))
    email = _safe_text(raw_dict.get("email"))
    phone = _safe_text(raw_dict.get("phone"))
    links = [value for value in _safe_items(raw_dict.get("links")) if isinstance(value, str)]

    # Build structured EducationDetail models before deriving the summary.
    edu_details = []
    for index, item in enumerate(_safe_items(raw_dict.get("education"))):
        model = _safe_model(EducationDetail, item, "education", index, warnings)
        if model is not None:
            edu_details.append(model)

    education_summary = extract_education_summary_string(
        raw_dict.get("education"),
        sections=sections,
        education_details=edu_details,
    )
    if education_summary is None and warnings is not None:
        warnings.append("No education entry found")

    # Convert processed skill dicts to Skill models
    skill_models = []
    for index, item in enumerate(_safe_items(skills)):
        model = _safe_model(Skill, item, "skill", index, warnings)
        if model is not None:
            skill_models.append(model)

    # Partition hackathons vs internships
    hackathon_models, internship_models = partition_hackathons_and_internships(
        raw_hackathons=raw_dict.get("hackathons") or [],
        raw_internships=raw_dict.get("internships") or [],
        sections=sections,
        warnings=warnings,
    )

    # Filter certifications
    clean_certs = postprocess_certifications([
        value for value in _safe_items(raw_dict.get("certifications")) if isinstance(value, str)
    ])

    # Preferred roles
    preferred_roles = [
        value for value in _safe_items(raw_dict.get("preferred_roles")) if isinstance(value, str)
    ]

    # Build ProfilePrefill
    try:
        prefill = ProfilePrefill(
            name=name,
            email=email,
            education=education_summary,
            skills=skill_models,
            hackathons=hackathon_models,
            internships=internship_models,
            certifications=[value for value in clean_certs if isinstance(value, str)],
            preferred_roles=preferred_roles,
            cv_file=source_filename,
        )
    except (ValidationError, TypeError, ValueError) as error:
        if warnings is not None:
            warnings.append(f"Profile prefill validation failed; retained valid core fields: {str(error).splitlines()[0]}")
        prefill = ProfilePrefill(
            name=name,
            email=email,
            education=education_summary,
            skills=skill_models,
            cv_file=source_filename,
        )

    # Build structured ProjectDetail models
    project_details = []
    for index, item in enumerate(_safe_items(raw_dict.get("projects"))):
        if isinstance(item, dict):
            project_data = dict(item)
            if not _safe_text(project_data.get("title")):
                project_data["title"] = _short_project_title(project_data.get("description"))
            technologies = project_data.get("technologies")
            project_data["technologies"] = [
                value for value in technologies if isinstance(value, str)
            ] if isinstance(technologies, list) else []
            model = _safe_model(ProjectDetail, project_data, "project", index, warnings)
            if model is not None:
                project_details.append(model)
        elif warnings is not None:
            warnings.append(f"Dropped invalid project item at index {index}: item must be an object")

    # Build structured ExperienceDetail models
    exp_details = []
    for index, item in enumerate(_safe_items(raw_dict.get("experience"))):
        if isinstance(item, dict):
            exp_data = {
                "role": _safe_text(item.get("role")),
                "organization": _safe_text(item.get("organization")),
                "description": _safe_text(item.get("description")),
            }
            model = _safe_model(ExperienceDetail, exp_data, "experience", index, warnings)
            if model is not None:
                exp_details.append(model)
        elif warnings is not None:
            warnings.append(f"Dropped invalid experience item at index {index}: item must be an object")

    achievements = [
        value for value in _safe_items(raw_dict.get("achievements")) if isinstance(value, str)
    ]

    try:
        details = Details(
            phone=phone,
            links=links,
            education_details=edu_details,
            projects=project_details,
            experience=exp_details,
            achievements=achievements,
        )
    except (ValidationError, TypeError, ValueError) as error:
        if warnings is not None:
            warnings.append(f"Details validation failed; returned valid detail fields: {str(error).splitlines()[0]}")
        details = Details()

    return prefill, details
