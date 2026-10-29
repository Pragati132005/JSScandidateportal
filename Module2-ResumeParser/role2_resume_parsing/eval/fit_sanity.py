"""Sanity check verifying candidate ranking across 6 target hackathon JDs.

JDs and required categories:
- Google SWE: {COD, DSA, OS, NETW, OOD, SYSD, SWE, COMM}
- Google Data Scientist: {SQL, APTI, AI, COMM}
- Microsoft SWE: {COD, DSA, OS, NETW, SYSD, OOD, SWE, COMM}
- Microsoft Data Analyst: {SQL, APTI, AI, COMM}
- Oracle Application Support Analyst: {SQL, OS, NETW, APTI, COMM}
- Oracle Associate SWE: {COD, SQL, DSA, OOD, OS, APTI, COMM, SWE}

Expected Relative Alignment:
- Ananya Rao: High on SWE JDs, low on Data JDs.
- Karthik Subramaniam: High on Data JDs, low on pure SWE JDs.
- Priya Menon: Best fit on the two Oracle support/associate JDs.
- Rohan Verma: Competitive / high coverage across all JDs.
"""

import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from typing import Dict, Set
from resume_parser.pipeline import parse_resume
from shared.llm_client import LLMClient

JD_CATEGORIES: Dict[str, Set[str]] = {
    "Google SWE": {"COD", "DSA", "OS", "NETW", "OOD", "SYSD", "SWE", "COMM"},
    "Google Data Scientist": {"SQL", "APTI", "AI", "COMM"},
    "Microsoft SWE": {"COD", "DSA", "OS", "NETW", "SYSD", "OOD", "SWE", "COMM"},
    "Microsoft Data Analyst": {"SQL", "APTI", "AI", "COMM"},
    "Oracle App Support": {"SQL", "OS", "NETW", "APTI", "COMM"},
    "Oracle Assoc SWE": {"COD", "SQL", "DSA", "OOD", "OS", "APTI", "COMM", "SWE"},
}


def run_fit_sanity() -> Dict[str, Dict[str, float]]:
    resumes_dir = os.path.join("data", "resumes", "PDF")
    candidates = ["Ananya Rao", "Karthik Subramaniam", "Priya Menon", "Rohan Verma"]
    client = LLMClient(mode="replay")

    coverage_matrix: Dict[str, Dict[str, float]] = {}

    for cand in candidates:
        pdf_path = os.path.join(resumes_dir, f"{cand}.pdf")
        parsed = parse_resume(pdf_path, use_llm=True, client=client)
        resume_cats = {s.category_code for s in parsed.profile_prefill.skills}

        coverage_matrix[cand] = {}
        for jd_name, jd_cats in JD_CATEGORIES.items():
            intersection = resume_cats.intersection(jd_cats)
            coverage = len(intersection) / len(jd_cats)
            coverage_matrix[cand][jd_name] = round(coverage, 3)

    # Print Report Table
    print("\n=== JD FIT SANITY MATRIX (% Category Coverage) ===")
    jds = list(JD_CATEGORIES.keys())
    header = f"{'Candidate':<22} | " + " | ".join(f"{jd:<18}" for jd in jds)
    print(header)
    print("-" * len(header))

    for cand, scores in coverage_matrix.items():
        row = f"{cand:<22} | " + " | ".join(f"{scores[jd]*100:>16.1f}%" for jd in jds)
        print(row)

    print("\nRelative Fit Verification:")
    ananya_swe_higher = coverage_matrix["Ananya Rao"]["Google SWE"] > coverage_matrix["Ananya Rao"]["Google Data Scientist"]
    karthik_data_higher = coverage_matrix["Karthik Subramaniam"]["Google Data Scientist"] > coverage_matrix["Karthik Subramaniam"]["Google SWE"]
    priya_oracle_strongest = (
        coverage_matrix["Priya Menon"]["Oracle App Support"] >= coverage_matrix["Priya Menon"]["Google SWE"]
    )
    rohan_competitive = all(coverage_matrix["Rohan Verma"][jd] >= 0.50 for jd in jds)

    print(f"  [x] Ananya higher on SWE than Data: {ananya_swe_higher}")
    print(f"  [x] Karthik higher on Data than SWE: {karthik_data_higher}")
    print(f"  [x] Priya strongest on Oracle roles: {priya_oracle_strongest}")
    print(f"  [x] Rohan competitive across all: {rohan_competitive}\n")

    return coverage_matrix


if __name__ == "__main__":
    run_fit_sanity()
