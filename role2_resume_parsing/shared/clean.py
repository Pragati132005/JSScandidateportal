"""Shared text cleaning utility for document preprocessing.

Normalises Unicode, removes page headers/footers and numbering artifacts,
rejoins line-end hyphenations, and collapses broken lines within bullet points.
"""

import re
import unicodedata
from dataclasses import dataclass, field
from typing import List


@dataclass
class CleanResult:
    """Result of cleaning operation containing normalised text and recorded fixes."""
    text: str
    fixes: List[str] = field(default_factory=list)


PAGE_HEADER_FOOTER_PATTERNS = [
    re.compile(r"^RADIX Talent Match Hackathon\s*[·•-]?\s*Test Data\s*$", re.IGNORECASE),
    re.compile(r"^Page\s+\d+(\s+of\s+\d+)?\s*$", re.IGNORECASE),
    re.compile(r"^---\s*PAGE\s+\d+\s*---\s*$", re.IGNORECASE),
]


def clean_text(raw_text: str) -> CleanResult:
    """Preprocess and clean raw extracted document text.

    Args:
        raw_text: Raw text string from IngestResult.

    Returns:
        CleanResult with cleaned text and list of applied transformation messages.
    """
    fixes: List[str] = []
    if not raw_text or not raw_text.strip():
        return CleanResult(text="", fixes=["Input was empty"])

    # 1. Unicode normalisation (NFKC)
    norm_text = unicodedata.normalize("NFKC", raw_text)
    if norm_text != raw_text:
        fixes.append("Normalised Unicode characters to NFKC")

    # 2. Standardize quotation marks, em-dashes and hyphens
    standardized = (
        norm_text.replace("“", '"')
        .replace("”", '"')
        .replace("‘", "'")
        .replace("’", "'")
        .replace("—", " — ")
        .replace("–", " - ")
    )

    # 3. Strip page headers, footers and page markers line-by-line
    lines = standardized.splitlines()
    filtered_lines: List[str] = []
    removed_header_count = 0

    for line in lines:
        stripped = line.strip()
        if not stripped:
            filtered_lines.append("")
            continue

        is_header = False
        for pat in PAGE_HEADER_FOOTER_PATTERNS:
            if pat.match(stripped):
                is_header = True
                break

        if is_header:
            removed_header_count += 1
        else:
            filtered_lines.append(stripped)

    if removed_header_count > 0:
        fixes.append(f"Removed {removed_header_count} page header/footer/number line(s)")

    processed_text = "\n".join(filtered_lines)

    # 4. Rejoin hyphenated line breaks: e.g. "horizontally-\nscalable" -> "horizontally-scalable"
    hyphen_pattern = re.compile(r"(\b[a-zA-Z]+)-\s*\n\s*([a-zA-Z]+\b)")
    hyphen_matches = hyphen_pattern.findall(processed_text)
    if hyphen_matches:
        processed_text = hyphen_pattern.sub(r"\1-\2", processed_text)
        fixes.append(f"Rejoined {len(hyphen_matches)} line-break hyphenation(s)")

    # 5. Normalise bullet glyphs
    bullet_glyphs = ["•", "·", "●", "○", "■", "▪", "➢", "*", "- "]
    bullet_re = re.compile(r"^\s*([•·●○■▪➢]|\*(?!\*)|-\s+)\s*")

    cleaned_lines: List[str] = []
    for line in processed_text.splitlines():
        trimmed = line.strip()
        if not trimmed:
            cleaned_lines.append("")
            continue
        if bullet_re.match(trimmed):
            # Standardise to bullet prefix
            standard_bullet = bullet_re.sub("• ", trimmed)
            cleaned_lines.append(standard_bullet)
        else:
            cleaned_lines.append(trimmed)

    # 6. Collapse broken lines inside bullets
    # If previous line is a bullet and current line does not start with bullet,
    # does not look like a section header, and is not empty, merge them.
    collapsed_lines: List[str] = []
    for line in cleaned_lines:
        if not line:
            collapsed_lines.append("")
            continue

        if (
            collapsed_lines
            and collapsed_lines[-1].startswith("• ")
            and not line.startswith("• ")
            and not line.endswith(":")
            and len(line.split()) > 0
            and not any(line.lower().startswith(h) for h in [
                "education", "technical skills", "projects", "hackathons",
                "certifications", "achievements", "preferred roles", "experience"
            ])
        ):
            collapsed_lines[-1] = collapsed_lines[-1] + " " + line
            fixes.append("Collapsed wrapped bullet line")
        else:
            collapsed_lines.append(line)

    # Clean multiple consecutive blank lines
    final_text = re.sub(r"\n{3,}", "\n\n", "\n".join(collapsed_lines)).strip()

    return CleanResult(text=final_text, fixes=fixes)
