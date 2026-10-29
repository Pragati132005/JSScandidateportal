# Role 2 Demo Script

Five-minute walkthrough for the Resume Parsing module.

## 0:00–0:30 — Problem

“A resume is unstructured input, but the downstream profile and talent checks need reliable structured data. Role 2 converts a PDF or DOCX into grounded skills, candidate details, warnings, category gaps, and a Profile Builder prefill.”

Show the input file: `data/resumes/PDF/Rohan Verma.pdf`.

## 0:30–1:15 — Architecture

Show the flow:

`file → ingest → clean → segment → LLM + dictionary fallback → evidence grounding → taxonomy → profile prefill`

Point out that the parser supports PDF and DOCX, uses replay/cache mode for deterministic offline demos, and can fall back to rules when the LLM is unavailable.

## 1:15–2:30 — Live parse

Run:

```powershell
& .\.venv\Scripts\python.exe -m resume_parser.cli parse "data/resumes/PDF/Rohan Verma.pdf" --out rohan_demo.json
```

Open `rohan_demo.json` and show:

- `skills`: canonical RADIX categories, confidence, exact evidence, `evidence_verified`, and `source_kind`.
- `meta.parse_warnings`: missing contact information or other extraction warnings.
- `meta.categories_without_evidence` and `meta.suggested_manual_additions`: the evidence gap signal.
- `profile_prefill`: the object Role 3 can load directly, including education, projects, internships, certifications, and preferred roles.

Call out that `company` and `role` stay `null` because those belong to the selected job description, not the candidate resume.

## 2:30–3:30 — Candidate differences

Parse another candidate:

```powershell
& .\.venv\Scripts\python.exe -m resume_parser.cli parse "data/resumes/PDF/Priya Menon.pdf" --out priya_demo.json
```

Compare the two JSON files. Their skill sets, category summaries, certifications, preferred roles, and gap lists differ, so downstream readiness and matching results can differ by candidate.

For a no-LLM reliability demonstration, run:

```powershell
& .\.venv\Scripts\python.exe -m resume_parser.cli parse "data/resumes/PDF/Priya Menon.pdf" --no-llm
```

The rule-based result remains schema-valid and includes the fallback warning.

## 3:30–4:15 — Quality proof

Run the offline checks:

```powershell
& .\.venv\Scripts\python.exe -m pytest -q
& .\.venv\Scripts\python.exe eval/eval.py
```

Report the verified gates: 100% core recall, 100% implied recall on the gold set, zero forbidden-category violations, 100% grounding, and 100% PDF/DOCX skill-set similarity for the four samples.

## 4:15–5:00 — Challenge faced

“The biggest challenge was that each sample had a fit-label sentence directly below the candidate name. It looked like useful skill evidence, but it was test metadata and could inflate the result. We detect headline-like lines, exclude them from evidence, and verify every retained quote against the cleaned source. We also reject placeholder certification text and surface missing categories instead of inventing skills. The evaluation harness made those rules measurable: headline leaks and placeholder leaks are zero, while every verified skill remains grounded.”

Close by showing that the output is ready for Role 3 through `profile_prefill`, and that Role 4/5 can consume `category_summary` and `skills` without parsing the resume again.

## Backup notes

- The replay cache is pre-warmed for all four candidates in both PDF and DOCX formats with `scripts/warm_cache.py`.
- Scanned PDFs attempt OCR only when optional Tesseract dependencies are installed; otherwise the parser continues with an explicit warning.
- If the API is preferred, start `uvicorn resume_parser.api:app --reload --port 8000`, then upload through `/docs`.
