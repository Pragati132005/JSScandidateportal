"""Command-line interface for Role 2 Resume Parser.

Usage:
    python -m resume_parser.cli parse <file> [--out out.json] [--no-llm]
"""

import argparse
import json
import os
import sys

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from resume_parser.pipeline import parse_resume
from resume_parser.errors import (
    MAX_UPLOAD_BYTES,
    OVERSIZE_FILE_MESSAGE,
    UNSUPPORTED_FILE_MESSAGE,
    UNREADABLE_FILE_MESSAGE,
    classify_parse_error,
)


def main():
    parser = argparse.ArgumentParser(
        prog="resume-parser",
        description="RADIX Talent Match - Role 2 Resume Parsing CLI",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    parse_cmd = subparsers.add_parser("parse", help="Parse a resume file (PDF or DOCX)")
    parse_cmd.add_argument("file", help="Path to resume document")
    parse_cmd.add_argument("--out", "-o", help="Optional output JSON filepath", default=None)
    parse_cmd.add_argument(
        "--no-llm",
        action="store_true",
        help="Disable LLM extraction and run pure rule-based dictionary parser",
    )

    args = parser.parse_args()

    if args.command == "parse":
        if not os.path.exists(args.file):
            print(f"Error: {UNREADABLE_FILE_MESSAGE}", file=sys.stderr)
            sys.exit(1)

        if os.path.splitext(args.file)[1].lower() not in {".pdf", ".docx"}:
            print(f"Error: {UNSUPPORTED_FILE_MESSAGE}", file=sys.stderr)
            sys.exit(1)

        try:
            if os.path.getsize(args.file) > MAX_UPLOAD_BYTES:
                print(f"Error: {OVERSIZE_FILE_MESSAGE}", file=sys.stderr)
                sys.exit(1)
        except OSError:
            print(f"Error: {UNREADABLE_FILE_MESSAGE}", file=sys.stderr)
            sys.exit(1)

        try:
            result = parse_resume(args.file, use_llm=not args.no_llm)
            json_output = result.model_dump_json(indent=2)

            if args.out:
                with open(args.out, "w", encoding="utf-8") as f:
                    f.write(json_output)
                print(f"Parsed result saved to: {args.out}")
            else:
                print(json_output)

        except Exception as error:
            _, message, _ = classify_parse_error(error)
            print(f"Error: {message}", file=sys.stderr)
            sys.exit(2)


if __name__ == "__main__":
    main()
