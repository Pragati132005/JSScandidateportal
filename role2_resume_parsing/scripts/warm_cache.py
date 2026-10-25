"""Pre-warm execution cache for the 4 demo resumes in preparation for demo day.

Ensures zero-latency responses and 100% offline reliability during live presentation.
"""

import os
import sys
import time

# Ensure project root in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from resume_parser.pipeline import parse_resume
from shared.llm_client import LLMClient


def warm_cache():
    print("=== Warming Cache for Demo Candidates ===\n")
    candidates = ["Ananya Rao", "Karthik Subramaniam", "Priya Menon", "Rohan Verma"]
    resumes_dir = os.path.join("data", "resumes")
    client = LLMClient(mode="replay")

    for cand in candidates:
        for fmt, folder, ext in [("PDF", "PDF", ".pdf"), ("DOCX", "Word", ".docx")]:
            fname = f"{cand}{ext}"
            fpath = os.path.join(resumes_dir, folder, fname)
            if not os.path.exists(fpath):
                continue

            start = time.time()
            parsed = parse_resume(fpath, use_llm=True, client=client)
            elapsed_ms = int((time.time() - start) * 1000)

            print(f"  [OK] Warmed: {fname:<30} | Skills: {len(parsed.profile_prefill.skills):>2} | Time: {elapsed_ms:>3}ms | Cached: {parsed.meta.from_cache}")

    print("\nCache pre-warming completed successfully. Ready for offline demo!")


if __name__ == "__main__":
    warm_cache()
