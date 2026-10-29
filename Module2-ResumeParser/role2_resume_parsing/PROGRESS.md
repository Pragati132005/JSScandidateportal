# PROGRESS
Last updated: 2026-10-25 16:25 IST  |  Current milestone: M15  |  Core tag: v1.0-final

| Milestone | Status (TODO / IN_PROGRESS / BLOCKED / DONE) | Date | Verified by | Notes / leftovers |
|---|---|---|---|---|
| M0 Bootstrap | DONE | 2026-10-25 | pytest -q passed, git init | Layout, virtualenv, dependencies, data samples, config |
| M1 Contract and fixtures | DONE | 2026-10-25 | 7 tests passed | Schema export, Rohan & Priya fixtures ready for Role 3 |
| M2 Ingest | DONE | 2026-10-25 | 17 tests passed | PDF (pdfplumber+pymupdf) & DOCX (python-docx) extraction |
| M3 Clean and segment | DONE | 2026-10-25 | 12 tests passed | Normalisation, fit label detection, 7 sections isolated |
| M4 LLM client, cache and modes | DONE | 2026-10-25 | 6 tests passed | Failover, caching, replay/mock modes, ping script |
| M5 Taxonomy and normalisation | DONE | 2026-10-25 | 25 tests passed | 12 RADIX categories, canonical lookup, fuzzy alias match |
| M6 LLM extraction | DONE | 2026-10-25 | 8 tests passed | p1 prompt, extraction runner, 8 recorded responses in replay |
| M7 Post-processing | DONE | 2026-10-25 | 8 tests passed | Grounding, dedupe, placeholder rejection, full pipeline |
| M8 Rule-based fallback & fusion | DONE | 2026-10-25 | 5 tests passed | Zero-LLM dictionary parser + consensus fusion |
| M9 Gold files and eval harness | DONE | 2026-10-25 | 100% quality gates green | Core recall 100%, 0 violations, 100% grounded, report written |
| M10 Robustness: adversarial resumes | DONE | 2026-10-25 | 5 adversarial tests passed | Resilient to unsegmented, scrambled, multi-column, injection |
| M11 Packaging and integration | DONE | 2026-10-25 | 5 tests passed | CLI, FastAPI with CORS, warm_cache, INTEGRATION.md, README |
| M12 Core freeze | DONE | 2026-10-25 | 93 tests, 100% gates green | Tagged v1.0-core. Stable core ready for integration |
| M13 Tier 2: category summary & gaps | DONE | 2026-10-25 | 115 tests, eval PASS | category_summary rollup, gap detection, suggested_manual_additions, schema v1.1 changelog |
| M14 Tier 3: OCR fallback & signals | DONE | 2026-10-25 | pytest -q and eval/eval.py PASS | Optional OCR for textless PDFs, source_kind per skill, schema v1.2; local machine lacks Tesseract so successful OCR remains environment-dependent |
| M15 Final regression & demo ready | DONE | 2026-10-25 | pytest -q, eval/eval.py, warm_cache.py all passed | Five-minute walkthrough in docs/DEMO_SCRIPT.md; replay cache warmed for all 8 sample files; final tag v1.0-final |

## Blockers
- None currently.

## Open questions for the team (contract)
- `company` and `role` are null for resumes (only make sense for JDs)
- `hackathons` and `internships` items are objects in profile_prefill (`title`, `result`, etc.)
- Extra fields provided: `evidence_verified`, `source_section`, `source_kind`, `details`, `category_summary`, `meta`
- Ambiguous tags: Docker (SWE vs CLOUD, v0 = SWE), statistics (AI/APTI/OTHER, v0 = OTHER), Redis (OTHER)

## Next 3 actions
1. Rehearse the five-minute Role 2 demo from `docs/DEMO_SCRIPT.md`.
2. Share `contract/resume_parse_result.schema.json` and `shared/taxonomy/taxonomy_v1.json` with the integration team.
3. Keep the core frozen; any later change must rerun the full test suite and evaluator.
