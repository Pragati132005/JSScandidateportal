"""
Command Line Interface for Role 1: JD Analytics.
Usage:
    python -m src.cli <path_to_jd_file> [--output <output.json>] [--company <name>] [--role <title>]
"""

import argparse
import json
import sys
from pathlib import Path
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from .extractor import JDExtractor


def main():
    parser = argparse.ArgumentParser(
        description="RADIX Talent Match - Role 1: JD Analytics Extractor"
    )
    parser.add_argument(
        "file",
        help="Path to the Job Description file (.pdf, .docx, or .txt)"
    )
    parser.add_argument(
        "-o", "--output",
        help="Path to save the extracted JSON output (default: prints to stdout)",
        default=None
    )
    parser.add_argument(
        "--company",
        help="Explicit company name (optional override)",
        default=None
    )
    parser.add_argument(
        "--role",
        help="Explicit job role title (optional override)",
        default=None
    )
    parser.add_argument(
        "--provider",
        choices=["gemini", "openai", "auto"],
        default="auto",
        help="LLM provider to use (default: auto)"
    )

    args = parser.parse_args()

    input_path = Path(args.file)
    if not input_path.exists():
        print(f"Error: File '{args.file}' does not exist.", file=sys.stderr)
        sys.exit(1)

    print(f"[*] Processing JD: {input_path.name}...")
    extractor = JDExtractor(provider=args.provider)

    try:
        result = extractor.extract_from_file(
            file_path=input_path,
            company=args.company,
            role=args.role
        )
        formatted_json = json.dumps(result.to_contract_dict(), indent=2)

        if args.output:
            out_file = Path(args.output)
            out_file.parent.mkdir(parents=True, exist_ok=True)
            out_file.write_text(formatted_json, encoding="utf-8")
            print(f"[✓] Extracted {len(result.skills)} skills successfully saved to: {args.output}")
        else:
            print("\n========== EXTRACTED RADIX DATA CONTRACT JSON ==========\n")
            print(formatted_json)

    except Exception as e:
        print(f"Error during extraction: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
