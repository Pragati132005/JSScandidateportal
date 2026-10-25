"""Comprehensive Evaluation Harness for Role 2 (Resume Parsing).

Calculates core recall, implied recall, forbidden category violations,
evidence grounding rate, schema validity, field integrity, and PDF/DOCX stability.
"""

import json
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from typing import Any, Dict, List, Set
from contract.schema import ResumeParseResult
from resume_parser.pipeline import parse_resume
from shared.llm_client import LLMClient


def jaccard_similarity(set_a: Set[str], set_b: Set[str]) -> float:
    """Compute Jaccard similarity index between two sets."""
    if not set_a and not set_b:
        return 1.0
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    return intersection / union if union > 0 else 0.0


def run_eval() -> Dict[str, Any]:
    gold_dir = "gold"
    resumes_dir = os.path.join("data", "resumes")
    expected_pack = [
        os.path.join(resumes_dir, "PDF", "Ananya Rao.pdf"),
        os.path.join(resumes_dir, "Word", "Ananya Rao.docx"),
    ]
    missing_pack = [path for path in expected_pack if not os.path.exists(path)]
    if missing_pack:
        raise FileNotFoundError(
            "Organizer resume pack is missing. Place the supplied pack under "
            "data/resumes/PDF and data/resumes/Word before running the eval."
        )
    reports_dir = os.path.join("eval", "reports")
    os.makedirs(reports_dir, exist_ok=True)

    candidates = [
        ("Ananya Rao", "ananya_rao.json"),
        ("Karthik Subramaniam", "karthik_subramaniam.json"),
        ("Priya Menon", "priya_menon.json"),
        ("Rohan Verma", "rohan_verma.json"),
    ]

    client = LLMClient(mode="replay")
    results_table = []
    overall_passes = True

    pdf_skill_sets: Dict[str, Set[str]] = {}
    docx_skill_sets: Dict[str, Set[str]] = {}

    for cand_name, gold_fname in candidates:
        gold_path = os.path.join(gold_dir, gold_fname)
        with open(gold_path, "r", encoding="utf-8") as f:
            gold = json.load(f)

        gold_core_canonicals = {s["canonical"].lower() for s in gold["core_skills"]}
        gold_implied_canonicals = {s["canonical"].lower() for s in gold["implied_skills"]}
        absent_categories = set(gold.get("absent_categories", []))

        for fmt, folder, ext in [("PDF", "PDF", ".pdf"), ("DOCX", "Word", ".docx")]:
            fname = f"{cand_name}{ext}"
            fpath = os.path.join(resumes_dir, folder, fname)

            parsed: ResumeParseResult = parse_resume(fpath, use_llm=True, client=client)

            # 1. Schema Validity
            schema_valid = isinstance(parsed, ResumeParseResult)

            # 2. Extracted Skills Analysis
            extracted_skills = parsed.profile_prefill.skills
            extracted_canonicals = {s.skill_name.lower() for s in extracted_skills}

            if fmt == "PDF":
                pdf_skill_sets[cand_name] = extracted_canonicals
            else:
                docx_skill_sets[cand_name] = extracted_canonicals

            # Core Recall
            matched_core = gold_core_canonicals.intersection(extracted_canonicals)
            core_recall = len(matched_core) / len(gold_core_canonicals) if gold_core_canonicals else 1.0

            # Implied Recall
            matched_implied = gold_implied_canonicals.intersection(extracted_canonicals)
            implied_recall = len(matched_implied) / len(gold_implied_canonicals) if gold_implied_canonicals else 1.0
            missed_implied = sorted(gold_implied_canonicals - extracted_canonicals)

            # Forbidden Category Violations
            extracted_categories = {s.category_code for s in extracted_skills}
            violations = extracted_categories.intersection(absent_categories)
            forbidden_violations = len(violations)

            # Grounding Rate
            verified_count = sum(1 for s in extracted_skills if s.evidence_verified)
            total_skills = len(extracted_skills)
            grounding_rate = verified_count / total_skills if total_skills > 0 else 1.0

            # Headline as evidence check
            headline_leaks = 0
            for s in extracted_skills:
                ev = s.evidence.lower()
                if "strong fit" in ev or "weaker fit" in ev or "best fit" in ev or "all-rounder" in ev:
                    headline_leaks += 1

            # Placeholder Leakage check
            placeholder_leakage = 0
            for c in parsed.profile_prefill.certifications:
                if any(p in c.lower() for p in ["none", "no formal", "n/a"]):
                    placeholder_leakage += 1

            # Field checks
            name_ok = parsed.profile_prefill.name == cand_name
            edu_ok = parsed.profile_prefill.education is not None and len(parsed.profile_prefill.education) > 5

            # Quality Gate Checks
            gate_pass = (
                core_recall >= 0.99
                and implied_recall >= 0.80
                and forbidden_violations == 0
                and grounding_rate >= 0.99
                and schema_valid
                and headline_leaks == 0
                and placeholder_leakage == 0
                and name_ok
                and edu_ok
            )

            if not gate_pass:
                overall_passes = False

            results_table.append({
                "candidate": cand_name,
                "format": fmt,
                "core_recall": f"{core_recall*100:.1f}%",
                "implied_recall": f"{implied_recall*100:.1f}%",
                "missed_implied": missed_implied,
                "forbidden_violations": forbidden_violations,
                "grounding_rate": f"{grounding_rate*100:.1f}%",
                "headline_leaks": headline_leaks,
                "placeholder_leaks": placeholder_leakage,
                "schema_valid": "PASS" if schema_valid else "FAIL",
                "status": "PASS" if gate_pass else "FAIL",
            })

            if missed_implied:
                print(f"Missed implied skills ({cand_name} {fmt}): {', '.join(missed_implied)}")
            else:
                print(f"Missed implied skills ({cand_name} {fmt}): none")

    # PDF vs DOCX Stability Checks
    stability_table = []
    for cand_name, _ in candidates:
        sim = jaccard_similarity(pdf_skill_sets.get(cand_name, set()), docx_skill_sets.get(cand_name, set()))
        sim_pass = sim >= 0.95
        if not sim_pass:
            overall_passes = False
        stability_table.append({
            "candidate": cand_name,
            "jaccard_similarity": f"{sim*100:.1f}%",
            "status": "PASS" if sim_pass else "FAIL",
        })

    # Generate Markdown Report
    report_lines = [
        "# Evaluation Report: Role 2 Resume Parsing",
        f"**Overall Status:** {'PASS' if overall_passes else 'FAIL'}\n",
        "### Accuracy and Quality Metrics",
        "| Candidate | Format | Core Recall | Implied Recall | Forbidden Violations | Grounding Rate | Headline Leaks | Placeholder Leaks | Schema | Status |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    for row in results_table:
        report_lines.append(
            f"| {row['candidate']} | {row['format']} | {row['core_recall']} | {row['implied_recall']} | "
            f"{row['forbidden_violations']} | {row['grounding_rate']} | {row['headline_leaks']} | "
            f"{row['placeholder_leaks']} | {row['schema_valid']} | {row['status']} |"
        )

    report_lines.extend([
        "\n### PDF vs DOCX Equivalence (Jaccard Similarity)",
        "| Candidate | Jaccard Similarity | Status |",
        "|---|---|---|",
    ])
    for srow in stability_table:
        report_lines.append(f"| {srow['candidate']} | {srow['jaccard_similarity']} | {srow['status']} |")

    report_lines.extend([
        "\n### Missed implied skills",
        "| Candidate | Format | Missed skills |",
        "|---|---|---|",
    ])
    for row in results_table:
        missed = ", ".join(row["missed_implied"]) or "none"
        report_lines.append(f"| {row['candidate']} | {row['format']} | {missed} |")

    report_content = "\n".join(report_lines)
    report_path = os.path.join(reports_dir, "latest.md")
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)

    print("\n" + report_content + "\n")
    return {"passed": overall_passes, "results": results_table, "stability": stability_table}


if __name__ == "__main__":
    try:
        eval_res = run_eval()
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(2)
    if not eval_res["passed"]:
        sys.exit(1)
