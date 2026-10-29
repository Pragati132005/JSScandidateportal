"""Shared user-facing error messages and parse-error classification."""

import zipfile
from typing import Tuple


UNREADABLE_FILE_MESSAGE = "This file couldn’t be read. It may be empty or corrupted."
UNSUPPORTED_FILE_MESSAGE = "This file type isn’t supported. Please upload a PDF or DOCX file."
OVERSIZE_FILE_MESSAGE = "This file is too large. Please upload a file under 10 MB."
UNEXPECTED_ERROR_MESSAGE = "An unexpected error occurred while parsing the file."
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def classify_parse_error(error: Exception) -> Tuple[str, str, int]:
    """Return a stable error code, friendly message, and HTTP status."""
    unreadable_types = (
        EOFError,
        FileNotFoundError,
        PermissionError,
        UnicodeDecodeError,
        zipfile.BadZipFile,
    )
    if isinstance(error, unreadable_types) or isinstance(error, ValueError):
        return "unreadable_file", UNREADABLE_FILE_MESSAGE, 422
    runtime_message = str(error).lower()
    if isinstance(error, RuntimeError) and any(
        marker in runtime_message
        for marker in ("pymupdf", "failed to read docx", "no extractable text", "empty")
    ):
        return "unreadable_file", UNREADABLE_FILE_MESSAGE, 422
    return "internal_error", UNEXPECTED_ERROR_MESSAGE, 500


def error_payload(error: str, message: str) -> dict[str, str]:
    """Build the common API error response body."""
    return {"error": error, "message": message}
