"""
Document Parser for JD Analytics.
Extracts clean plain text from PDF, DOCX, and TXT files.
"""

import os
from pathlib import Path
from typing import Optional


def extract_text_from_pdf(file_path: Path) -> str:
    """Extracts text from a PDF file using pypdf."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(str(file_path))
        text_blocks = []
        for idx, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                text_blocks.append(page_text.strip())
        return "\n\n".join(text_blocks)
    except ImportError:
        # Fallback to pdfplumber or pypdf2 if available
        try:
            import pdfplumber
            with pdfplumber.open(str(file_path)) as pdf:
                return "\n\n".join([page.extract_text() or "" for page in pdf.pages]).strip()
        except ImportError:
            raise ImportError("Please install 'pypdf' (`pip install pypdf`) to parse PDF files.")


def extract_text_from_docx(file_path: Path) -> str:
    """Extracts text from a DOCX file using python-docx."""
    try:
        import docx
        doc = docx.Document(str(file_path))
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    full_text.append(" | ".join(row_text))
        return "\n".join(full_text)
    except ImportError:
        raise ImportError("Please install 'python-docx' (`pip install python-docx`) to parse Word documents.")


def parse_jd_file(file_path: str | Path) -> str:
    """
    Parses any supported Job Description file (.pdf, .docx, .txt, .md)
    and returns sanitized text content.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = path.suffix.lower()
    if ext == ".pdf":
        raw_text = extract_text_from_pdf(path)
    elif ext in [".docx", ".doc"]:
        raw_text = extract_text_from_docx(path)
    elif ext in [".txt", ".md"]:
        raw_text = path.read_text(encoding="utf-8", errors="ignore")
    else:
        # Try reading as text
        raw_text = path.read_text(encoding="utf-8", errors="ignore")

    # Clean up excess whitespace and blank lines
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    return "\n".join(lines)
