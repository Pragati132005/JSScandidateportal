"""Resume segmentation into structured sections and headline/fit-label isolation.

Identifies sections via fuzzy/synonym matching while isolating self-declared
fit statements or synthetic evaluation headlines so they are never used as skill evidence.
"""

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from rapidfuzz import fuzz


@dataclass
class SegmentResult:
    """Structured segmentation output for a parsed resume."""
    candidate_name: Optional[str] = None
    headline_fit_label: Optional[str] = None
    sections: Dict[str, str] = field(default_factory=dict)
    non_evidence_lines: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    unrecognized_headings: List[str] = field(default_factory=list)


# Canonical section definitions and common synonyms
SECTION_SYNONYMS: Dict[str, List[str]] = {
    "education": [
        "education",
        "academic background",
        "academics",
        "academic qualifications",
        "education & qualifications",
        "academics & degrees",
        "degrees",
        "university",
        "college",
        "institute",
        "school",
    ],
    "skills": [
        "skill",
        "technical skills",
        "technical skill",
        "key skills",
        "skills",
        "tech stack",
        "technical proficiencies",
        "core skills",
        "skills & tools",
        "programming skills",
        "core competencies",
        "core competencies & stack",
        "competencies",
        "qualifications & skills",
    ],
    "projects": [
        "project",
        "projects",
        "key projects",
        "academic projects",
        "personal projects",
        "technical projects",
        "experience & projects",
        "projects & internships",
        "projects and internships",
        "projects/internships",
    ],
    "hackathons": [
        "hackathons / internships",
        "hackathons and internships",
        "hackathons & internships",
        "hackathons internships",
        "hackathons",
        "hackathon",
        "internships",
        "internship",
        "competitions",
        "honors & competitions",
    ],
    "experience": [
        "experience",
        "work experience",
        "work",
        "employment history",
        "professional experience",
        "industry experience",
        "work history",
        "work history & industry experience",
    ],
    "certifications": [
        "certification",
        "certifications",
        "certificate",
        "courses",
        "certificates",
        "licenses & certifications",
        "online courses",
    ],
    "achievements": [
        "achievement",
        "achievements",
        "awards",
        "honors",
        "key achievements",
        "accomplishments",
    ],
    "other": [
        "professional summary",
        "professional profile",
        "summary",
        "profile",
        "preferred roles",
        "target roles",
        "target positions",
        "career objective",
        "objective",
        "desired roles",
    ],
}

CANONICAL_SECTIONS = {
    "skills",
    "education",
    "projects",
    "experience",
    "hackathons",
    "certifications",
    "achievements",
    "other",
}

FIT_LABEL_INDICATORS = [
    "fit for",
    "strong fit",
    "weaker fit",
    "best fit",
    "all-rounder",
    "generalist",
    "leaning",
    "entry-level",
    "competitive fit",
]

NAME_ROLE_WORDS = {
    "analyst", "computer", "consultant", "coordinator", "creator", "designer", "developer",
    "engineer", "intern", "manager", "specialist", "student", "technician",
    "administrator", "architect", "lead", "scientist", "support",
}


def is_fit_label(line: str) -> bool:
    """Check if line is a self-declared or synthetic fit/headline assessment."""
    lowered = line.lower()
    return any(indicator in lowered for indicator in FIT_LABEL_INDICATORS)


def _looks_like_name_line(line: str) -> bool:
    """Accept short header name lines while excluding contact and role text."""
    if not line or any(character.isdigit() for character in line):
        return False
    if re.search(r"@|https?://|linkedin|github", line, re.I):
        return False
    tokens = line.split()
    if not 1 <= len(tokens) <= 4:
        return False
    if any(not re.fullmatch(r"[A-Za-z][A-Za-z'’-]*", token) for token in tokens):
        return False
    lowered = {token.lower() for token in tokens}
    return not lowered.intersection({word.strip() for word in NAME_ROLE_WORDS})


def match_heading(line: str, threshold: float = 85.0) -> Optional[str]:
    """Match a line against known section synonyms using fuzzy matching."""
    cleaned = re.sub(r"[:\-\#\*]", "", line).strip().lower()
    if not cleaned or len(cleaned.split()) > 5:
        # Section headings are concise
        return None

    best_match = None
    best_score = 0.0

    for canonical, synonyms in SECTION_SYNONYMS.items():
        for syn in synonyms:
            # Exact match check first
            if cleaned == syn:
                return canonical
            score = fuzz.ratio(cleaned, syn)
            if score > best_score:
                best_score = score
                best_match = canonical

    if best_score >= threshold and best_match:
        return best_match

    return None


def canonical_section_name(value: Optional[str]) -> str:
    """Map a section label or source-section value to the shared canonical set."""
    if not isinstance(value, str) or not value.strip():
        return "other"
    cleaned = value.strip().lower().replace("_", " ")
    cleaned = re.sub(r"\s+", " ", cleaned)
    if cleaned in CANONICAL_SECTIONS:
        return cleaned
    matched = match_heading(cleaned)
    return matched if matched in CANONICAL_SECTIONS else "other"


def _looks_like_unrecognized_heading(line: str) -> bool:
    """Identify likely all-caps headings without treating short skills as headings."""
    tokens = line.split()
    return (
        2 <= len(tokens) <= 5
        and line == line.upper()
        and not any(character.isdigit() for character in line)
        and not re.search(r"[@:/]", line)
    )


def segment_resume(cleaned_text: str) -> SegmentResult:
    """Segment cleaned resume text into standard sections and identify non-evidence.

    Args:
        cleaned_text: Preprocessed text from clean_text().

    Returns:
        SegmentResult with identified sections, candidate name, and non-evidence lines.
    """
    lines = [line.strip() for line in cleaned_text.splitlines() if line.strip()]
    if not lines:
        return SegmentResult(warnings=["No text available to segment."])

    candidate_name = None
    headline_fit_label = None
    non_evidence: List[str] = []
    warnings: List[str] = []
    unrecognized_headings: List[str] = []

    # The name may be split across a few short header lines.
    name_lines = []
    line_idx = 0
    name_token_count = 0
    while line_idx < len(lines) and name_token_count < 4:
        line = lines[line_idx]
        if match_heading(line) or is_fit_label(line) or not _looks_like_name_line(line):
            break
        if name_token_count + len(line.split()) > 4:
            break
        name_lines.append(line)
        name_token_count += len(line.split())
        line_idx += 1
    if name_lines:
        candidate_name = " ".join(name_lines)
    else:
        candidate_name = lines[0]
        line_idx = 1

    # Check immediate subsequent lines for headline / fit labels before first heading
    while line_idx < len(lines):
        line = lines[line_idx]
        heading = match_heading(line)
        if heading:
            # Reached the first section
            break

        if is_fit_label(line):
            headline_fit_label = line
            non_evidence.append(line)
        elif not candidate_name:
            candidate_name = line
        else:
            # Secondary headline or summary
            non_evidence.append(line)
        line_idx += 1

    # Now parse sections
    sections: Dict[str, List[str]] = {}
    current_section = None

    while line_idx < len(lines):
        line = lines[line_idx]
        heading = match_heading(line)

        if heading:
            current_section = heading
            if current_section not in sections:
                sections[current_section] = []
        elif current_section:
            # If line is inside a section, check if it happens to be a fit label
            if is_fit_label(line):
                headline_fit_label = line
                non_evidence.append(line)
            elif _looks_like_unrecognized_heading(line):
                unrecognized_headings.append(line)
                sections[current_section].append(line)
            else:
                sections[current_section].append(line)
        else:
            # Uncategorized line before any heading
            if _looks_like_unrecognized_heading(line):
                unrecognized_headings.append(line)
            non_evidence.append(line)

        line_idx += 1

    # If no headings matched, return unsegmented text
    if not sections:
        warnings.append("No standard section headings detected; returning unsegmented.")
        return SegmentResult(
            candidate_name=candidate_name,
            headline_fit_label=headline_fit_label,
            sections={"unsegmented": cleaned_text},
            non_evidence_lines=non_evidence,
            warnings=warnings,
            unrecognized_headings=unrecognized_headings,
        )

    # Convert list of lines into joined text per section
    final_sections = {
        sec: "\n".join(sec_lines).strip()
        for sec, sec_lines in sections.items()
        if sec_lines
    }

    return SegmentResult(
        candidate_name=candidate_name,
        headline_fit_label=headline_fit_label,
        sections=final_sections,
        non_evidence_lines=non_evidence,
        warnings=warnings,
        unrecognized_headings=unrecognized_headings,
    )
