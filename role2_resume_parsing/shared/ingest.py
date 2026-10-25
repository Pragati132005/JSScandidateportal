"""Shared text ingestion utility for PDF and DOCX documents.

Reusable by both Role 1 (JD Analytics) and Role 2 (Resume Parsing).
Extracts text while preserving reading order and capturing metadata/warnings.
"""

import os
import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Sequence, Tuple


@dataclass
class IngestResult:
    """Standard container for extracted document text and metadata."""
    text: str
    pages: int
    input_format: Literal["pdf", "docx"]
    warnings: List[str] = field(default_factory=list)
    candidate_name: str | None = None


def detect_file_format(path: str) -> Literal["pdf", "docx"]:
    """Detect file format using both file extension and magic byte headers."""
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {path}")

    ext = os.path.splitext(path)[1].lower()

    with open(path, "rb") as f:
        header = f.read(16)

    # Magic byte checks
    if header.startswith(b"%PDF-"):
        return "pdf"
    if header.startswith(b"PK\x03\x04") and ext in [".docx", ".doc"]:
        return "docx"

    if ext == ".pdf":
        return "pdf"
    if ext == ".docx":
        return "docx"

    raise ValueError(
        f"Unsupported file format for '{path}'. Only PDF and DOCX are supported."
    )


def _group_pdf_words_by_line(words: Sequence[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
    """Group word-coordinate records into visual text lines."""
    lines: List[List[Dict[str, Any]]] = []
    for word in sorted(words, key=lambda item: (float(item["top"]), float(item["x0"]))):
        top = float(word["top"])
        matching_line = None
        for line in reversed(lines):
            if abs(top - float(line[0]["top"])) <= 3.0:
                matching_line = line
                break
            if float(line[0]["top"]) < top - 3.0:
                break
        if matching_line is None:
            lines.append([word])
        else:
            matching_line.append(word)

    for line in lines:
        line.sort(key=lambda item: float(item["x0"]))
    return lines


def _find_pdf_gutters(
    words: Sequence[Dict[str, Any]],
    page_width: float,
) -> List[Tuple[float, float]]:
    """Find sufficiently wide vertical whitespace bands separating columns."""
    lines = _group_pdf_words_by_line(words)
    if not lines:
        return []

    minimum_width = max(12.0, page_width * 0.02)
    candidates: List[Tuple[float, float, float, float]] = []
    for line in lines:
        for previous, following in zip(line, line[1:]):
            gap_start = float(previous["x1"])
            gap_end = float(following["x0"])
            gap_width = gap_end - gap_start
            if gap_width < minimum_width:
                continue
            if gap_start <= page_width * 0.1 or gap_end >= page_width * 0.9:
                continue
            candidates.append(
                (
                    (gap_start + gap_end) / 2.0,
                    gap_start,
                    gap_end,
                    float(line[0]["top"]),
                )
            )

    if not candidates:
        return []

    # A real gutter repeats at roughly the same x-coordinate across many
    # lines.  Full-width header lines can bridge the columns, so a global
    # union of all word intervals would incorrectly erase the gutter.
    candidates.sort(key=lambda item: item[0])
    clusters: List[List[Tuple[float, float, float, float]]] = []
    cluster_tolerance = max(10.0, page_width * 0.02)
    for candidate in candidates:
        if clusters and candidate[0] - clusters[-1][-1][0] <= cluster_tolerance:
            clusters[-1].append(candidate)
        else:
            clusters.append([candidate])

    viable = []
    for cluster in clusters:
        line_count = len({candidate[3] for candidate in cluster})
        if line_count < 2:
            continue
        gaps = sorted(candidate[2] - candidate[1] for candidate in cluster)
        score = line_count * line_count * gaps[len(gaps) // 2]
        viable.append((score, cluster))

    # Very short synthetic pages may expose the same gutter with different
    # gap centers on only two lines.  Fall back to overlapping gap intervals
    # in that case rather than disabling column-aware extraction entirely.
    if not viable:
        interval_clusters: List[List[Tuple[float, float, float, float]]] = []
        for candidate in candidates:
            matching_cluster = None
            for cluster in interval_clusters:
                cluster_start = min(item[1] for item in cluster)
                cluster_end = max(item[2] for item in cluster)
                if (
                    candidate[1] <= cluster_end + cluster_tolerance
                    and candidate[2] >= cluster_start - cluster_tolerance
                ):
                    matching_cluster = cluster
                    break
            if matching_cluster is None:
                interval_clusters.append([candidate])
            else:
                matching_cluster.append(candidate)
        for cluster in interval_clusters:
            line_count = len({candidate[3] for candidate in cluster})
            if line_count >= 2:
                gaps = sorted(candidate[2] - candidate[1] for candidate in cluster)
                viable.append((line_count * line_count * gaps[len(gaps) // 2], cluster))

    if any(len({candidate[3] for candidate in cluster}) >= 4 for _, cluster in viable):
        viable = [
            (score, cluster)
            for score, cluster in viable
            if len({candidate[3] for candidate in cluster}) >= 4
        ]

    gutters: List[Tuple[float, float]] = []
    for _, cluster in sorted(viable, key=lambda item: item[0], reverse=True):
        center = sum(candidate[0] for candidate in cluster) / len(cluster)
        suppression_tolerance = max(15.0, page_width * 0.03)
        if any(
            abs(center - (start + end) / 2.0) <= suppression_tolerance
            for start, end in gutters
        ):
            continue
        starts = sorted(candidate[1] for candidate in cluster)
        ends = sorted(candidate[2] for candidate in cluster)
        gutters.append((starts[len(starts) // 2], ends[len(ends) // 2]))

    return sorted(gutters)


def _pdf_lines_to_text(words: Sequence[Dict[str, Any]]) -> List[str]:
    """Render word records as ordered text lines."""
    lines = _group_pdf_words_by_line(words)
    rendered: List[str] = []
    for line in lines:
        parts: List[str] = []
        previous_word = None
        for word in line:
            text = str(word["text"])
            if previous_word is not None:
                gap = float(word["x0"]) - float(previous_word["x1"])
                previous_text = str(previous_word["text"])
                if (
                    len(previous_text) == len(text) == 1
                    and previous_text.isalpha()
                    and text.isalpha()
                    and previous_text.isupper()
                    and text.isupper()
                    and gap < 10.0
                ):
                    parts[-1] += text
                    previous_word = word
                    continue
                parts.append(" ")
            parts.append(text)
            previous_word = word
        rendered.append("".join(parts).strip())
    return rendered


def _looks_like_header_name_token(token: str) -> bool:
    """Return whether a token can safely be part of a header name."""
    return bool(re.fullmatch(r"[A-Za-z][A-Za-z'’-]*", token))


def _extract_pdf_header_name(page: Any) -> str | None:
    """Extract a large-font name block before contact details or headings."""
    try:
        words = page.extract_words(extra_attrs=["size"]) or []
    except Exception:
        return None
    if not words:
        return None

    contact_pattern = re.compile(
        r"(?:@|\+?\d[\d().\s-]{7,}\d|linkedin\b|github\.com|https?://)", re.I
    )
    heading_top = None
    contact_top = None
    for line in _group_pdf_words_by_line(words):
        line_text = " ".join(str(word["text"]) for word in line).strip()
        if contact_top is None and contact_pattern.search(line_text):
            contact_top = float(line[0]["top"])
        if (
            heading_top is None
            and line_text.lower() in {
                "education", "academic background", "academics", "degrees",
                "skills", "technical skills", "technical proficiencies", "tech stack",
                "skills & tools", "experience", "work experience", "work history",
                "professional experience", "industry experience", "employment history",
                "projects", "certifications", "achievements", "awards",
                "hackathons", "hackathons / internships", "internships",
                "target positions", "target roles", "desired roles", "career objective",
                "preferred roles", "core competencies", "core competencies & stack",
                "competencies", "honors & competitions",
            }
        ):
            heading_top = float(line[0]["top"])

    boundary = (
        contact_top
        if contact_top is not None
        else heading_top if heading_top is not None else float(page.height) * 0.3
    )
    header_lines = [
        line for line in _group_pdf_words_by_line(words)
        if line and float(line[0]["top"]) < boundary
    ]
    if not header_lines:
        return None

    largest_size = max(float(word.get("size", 0.0)) for line in header_lines for word in line)
    name_lines: List[str] = []
    for line in header_lines:
        line_text = " ".join(str(word["text"]) for word in line).strip()
        if not line or contact_pattern.search(line_text):
            continue
        name_words = [
            word for word in line
            if float(word.get("size", 0.0)) >= largest_size * 0.8
        ]
        tokens = [str(word["text"]) for word in name_words]
        if (
            len(tokens) > 3
            or any(not _looks_like_header_name_token(token) for token in tokens)
            or not tokens
        ):
            continue
        line_text = " ".join(tokens).strip()
        if (
            len(line_text.split()) <= 5
            and line_text.upper() == line_text
            and any(character.isalpha() for character in line_text)
            and line_text.lower() in {"work experience", "experience", "education", "skills"}
        ):
            continue
        name_lines.append(line_text)

    if not name_lines:
        return None
    name = " ".join(name_lines[:4]).strip()
    return name if 1 <= len(name.split()) <= 4 else None


def _pdf_header_to_text(
    words: Sequence[Dict[str, Any]],
    gutter_center: float,
) -> List[str]:
    """Render header lines without merging left and right contact blocks."""
    rendered: List[str] = []
    for line in _group_pdf_words_by_line(words):
        left = [
            word for word in line
            if (float(word["x0"]) + float(word["x1"])) / 2.0 < gutter_center
        ]
        right = [
            word for word in line
            if (float(word["x0"]) + float(word["x1"])) / 2.0 >= gutter_center
        ]
        is_letter_spaced_name = bool(line) and all(
            len(str(word["text"])) == 1 and str(word["text"]).isalpha()
            for word in line
        )
        if left and right and not is_letter_spaced_name:
            rendered.extend(_pdf_lines_to_text(left))
            rendered.extend(_pdf_lines_to_text(right))
        else:
            rendered.extend(_pdf_lines_to_text(line))
    return rendered


def _extract_pdf_page(page: Any) -> str:
    """Extract one page, using columns only when a clear gutter is present."""
    fallback = (page.extract_text(layout=False) or "").strip()
    try:
        words = page.extract_words() or []
    except Exception:
        return fallback

    gutters = _find_pdf_gutters(words, float(page.width))
    if not gutters:
        return fallback

    line_groups = _group_pdf_words_by_line(words)
    line_tops = [float(line[0]["top"]) for line in line_groups if line]
    header_end = 0.0
    primary_center = (gutters[0][0] + gutters[0][1]) / 2.0
    saw_header_cross_line = False
    for line in line_groups:
        centers = [
            (float(word["x0"]) + float(word["x1"])) / 2.0
            for word in line
        ]
        line_text = " ".join(str(word["text"]) for word in line).strip()
        spans_columns = (
            centers
            and min(centers) < primary_center
            and max(centers) >= primary_center
        )
        is_letter_spaced_name = bool(line) and all(
            len(str(word["text"])) == 1 and str(word["text"]).isalpha()
            for word in line
        )
        is_heading = (
            len(line_text.split()) <= 4
            and line_text.upper() == line_text
            and any(character.isalpha() for character in line_text)
        )
        if spans_columns and saw_header_cross_line and is_heading:
            header_end = float(line[0]["top"])
            break
        if spans_columns and not is_letter_spaced_name:
            saw_header_cross_line = True
            continue
        if not saw_header_cross_line or float(line[0]["top"]) > float(page.height) * 0.45:
            continue

        if is_heading:
            header_end = float(line[0]["top"])
            break

    if saw_header_cross_line and not header_end:
        header_end = 0.0

    header_words = [word for word in words if float(word["top"]) < header_end]
    body_words = [word for word in words if float(word["top"]) >= header_end]
    output_lines = _pdf_header_to_text(header_words, primary_center)

    boundaries = [0.0]
    boundaries.extend((start + end) / 2.0 for start, end in gutters)
    boundaries.append(float(page.width))
    for column_index in range(len(boundaries) - 1):
        left, right = boundaries[column_index], boundaries[column_index + 1]
        column_words = [
            word for word in body_words
            if left <= (float(word["x0"]) + float(word["x1"])) / 2.0 < right
        ]
        output_lines.extend(_pdf_lines_to_text(column_words))

    return "\n".join(line for line in output_lines if line).strip() or fallback


def _extract_pdf(path: str) -> IngestResult:
    """Extract text from a PDF file using pdfplumber with PyMuPDF fallback."""
    warnings: List[str] = []
    pages_count = 0
    extracted_text_pages: List[str] = []
    candidate_name = None

    # Attempt 1: pdfplumber
    try:
        import pdfplumber

        with pdfplumber.open(path) as pdf:
            pages_count = len(pdf.pages)
            for page in pdf.pages:
                if candidate_name is None:
                    candidate_name = _extract_pdf_header_name(page)
                ptxt = _extract_pdf_page(page)
                extracted_text_pages.append(ptxt.strip())
    except Exception as e:
        warnings.append(f"pdfplumber extraction failed ({e}); falling back to PyMuPDF.")
        extracted_text_pages = []

    combined = "\n\n".join(p for p in extracted_text_pages if p).strip()

    # Attempt 2: pymupdf fallback if pdfplumber failed or extracted no text
    if not combined:
        try:
            import pymupdf

            doc = pymupdf.open(path)
            pages_count = len(doc)
            fitz_pages = []
            for page in doc:
                txt = page.get_text() or ""
                fitz_pages.append(txt.strip())
            combined = "\n\n".join(p for p in fitz_pages if p).strip()
            if combined and "pdfplumber extraction failed" not in str(warnings):
                warnings.append("pdfplumber extracted empty text; fell back to PyMuPDF.")
        except Exception as e:
            raise RuntimeError(f"PyMuPDF fallback also failed for '{path}': {e}") from e

    if not combined:
        ocr_text, ocr_warnings = _extract_pdf_with_ocr(path)
        warnings.extend(ocr_warnings)
        combined = ocr_text

    if not combined:
        warnings.append(
            "No extractable text found; document may be a scanned image or empty."
        )

    return IngestResult(
        text=combined,
        pages=max(pages_count, 1),
        input_format="pdf",
        warnings=warnings,
        candidate_name=candidate_name,
    )


def _extract_pdf_with_ocr(path: str) -> tuple[str, List[str]]:
    """Try optional OCR for PDFs that contain no embedded text.

    OCR is deliberately optional: the Python wrapper and the Tesseract
    executable are not required for normal text-based resume parsing.
    """
    warnings: List[str] = []
    try:
        import pymupdf
        import pytesseract
        from PIL import Image
    except ImportError:
        warnings.append(
            "OCR fallback unavailable; install optional pytesseract, Pillow, and the Tesseract executable."
        )
        return "", warnings

    try:
        doc = pymupdf.open(path)
        page_text: List[str] = []
        for page in doc:
            pixmap = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), alpha=False)
            image = Image.frombytes("RGB", [pixmap.width, pixmap.height], pixmap.samples)
            text = pytesseract.image_to_string(image).strip()
            if text:
                page_text.append(text)
        doc.close()
    except Exception as exc:
        warnings.append(f"OCR fallback failed: {exc}")
        return "", warnings

    combined = "\n\n".join(page_text).strip()
    if combined:
        warnings.append("OCR fallback used because no embedded PDF text was found.")
    return combined, warnings


def _extract_docx(path: str) -> IngestResult:
    """Extract text from a DOCX file preserving paragraph and table order."""
    warnings: List[str] = []

    try:
        import docx

        doc = docx.Document(path)
    except Exception as e:
        raise RuntimeError(f"Failed to read DOCX document '{path}': {e}") from e

    elements: List[str] = []

    from docx.oxml.table import CT_Tbl
    from docx.oxml.text.paragraph import CT_P
    from docx.table import Table
    from docx.text.paragraph import Paragraph

    # Walk body XML children so paragraphs and tables retain document order.
    for child in doc.element.body.iterchildren():
        if isinstance(child, CT_P):
            txt = Paragraph(child, doc).text.strip()
            if txt:
                elements.append(txt)
        elif isinstance(child, CT_Tbl):
            table = Table(child, doc)
            for row in table.rows:
                row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_cells:
                    elements.append(" | ".join(row_cells))

    # Optional: check header and footer content across sections
    header_footer_text: List[str] = []
    for section in doc.sections:
        if section.header and section.header.paragraphs:
            for hp in section.header.paragraphs:
                ht = hp.text.strip()
                if ht and ht not in header_footer_text:
                    header_footer_text.append(ht)

    if header_footer_text:
        elements = header_footer_text + elements

    combined = "\n".join(elements).strip()
    if not combined:
        warnings.append("No extractable text found; DOCX document appears empty.")

    return IngestResult(
        text=combined,
        pages=1,  # DOCX does not have fixed physical pages without rendering engine
        input_format="docx",
        warnings=warnings,
    )


def extract_text(path: str) -> IngestResult:
    """Unified entry point to extract text from PDF or DOCX file.

    Args:
        path: Path to the target PDF or DOCX file.

    Returns:
        IngestResult containing extracted text, page count, format, and warnings.
    """
    file_format = detect_file_format(path)
    if file_format == "pdf":
        return _extract_pdf(path)
    else:
        return _extract_docx(path)
