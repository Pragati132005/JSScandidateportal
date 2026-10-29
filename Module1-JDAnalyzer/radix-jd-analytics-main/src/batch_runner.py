"""
Batch Extractor for RADIX Talent Match - Role 1 (JD Analytics).
Iterates over all sample JDs in data/sample_jds/ and outputs standardized JSON files.
"""

import os
import sys
import json
import time
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.extractor import JDExtractor
from src.schema import JDExtractionOutput


def run_batch_extraction(
    input_dir: Path = PROJECT_ROOT / "data" / "sample_jds",
    output_dir: Path = PROJECT_ROOT / "outputs" / "extracted_jds",
    prefer_format: str = "pdf"  # "pdf" or "docx" or "all"
):
    """Processes all JDs in input_dir and saves outputs to output_dir."""
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Collect JD files
    if prefer_format == "pdf":
        target_files = list(input_dir.glob("*.pdf"))
    elif prefer_format == "docx":
        target_files = list(input_dir.glob("*.docx"))
    else:
        target_files = list(input_dir.glob("*.pdf")) + list(input_dir.glob("*.docx"))

    if not target_files:
        # Fall back to any text files
        target_files = list(input_dir.glob("*.txt"))

    print(f"==================================================")
    print(f" RADIX Talent Match - Role 1: Batch JD Extraction")
    print(f" Found {len(target_files)} JD files to process")
    print(f" Output folder: {output_dir}")
    print(f"==================================================\n")

    extractor = JDExtractor()
    results_summary = []

    for idx, file_path in enumerate(target_files, start=1):
        clean_name = file_path.stem.replace(" ", "_").lower()
        out_json_path = output_dir / f"{clean_name}.json"

        print(f"[{idx}/{len(target_files)}] Processing: {file_path.name}...")
        try:
            start_t = time.time()
            output: JDExtractionOutput = extractor.extract_from_file(file_path)
            duration = round(time.time() - start_t, 2)

            # Save strictly conforming JSON file
            contract_dict = output.to_contract_dict()
            out_json_path.write_text(json.dumps(contract_dict, indent=2), encoding="utf-8")

            # Collect summary info
            cat_counts = {}
            for s in output.skills:
                c = s.category_code.value if hasattr(s.category_code, "value") else str(s.category_code)
                cat_counts[c] = cat_counts.get(c, 0) + 1

            summary_item = {
                "file": file_path.name,
                "company": output.company,
                "role": output.role,
                "total_skills": len(output.skills),
                "duration_seconds": duration,
                "output_file": str(out_json_path.name),
                "category_breakdown": cat_counts
            }
            results_summary.append(summary_item)

            print(f"    [OK] Extracted {len(output.skills)} skills ({duration}s)")
            print(f"    [OK] Company: {output.company} | Role: {output.role}")
            print(f"    [OK] Saved to: {out_json_path.name}")
            print(f"    [OK] Categories detected: {list(cat_counts.keys())}\n")

        except Exception as e:
            print(f"    [FAIL] Failed to process {file_path.name}: {e}\n")

    # Save summary index
    index_file = output_dir / "extraction_summary.json"
    index_file.write_text(json.dumps(results_summary, indent=2), encoding="utf-8")
    print(f"[Done] All extracted JDs ready in {output_dir}")
    print(f"Summary saved to {index_file.name}")


if __name__ == "__main__":
    run_batch_extraction()
