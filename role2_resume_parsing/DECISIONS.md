# Architectural & Implementation Decisions

This log records every non-obvious choice, assumption, and design decision made during the implementation of Role 2 (Resume Parsing).

---

## 2026-10-25 - D001: Project Layout and Virtual Environment Isolation
- **Decision:** Use Python 3.14 virtual environment in `.venv/` with explicit requirements in `requirements.txt`.
- **Reason:** Keeps all dependencies cleanly isolated, reproducible, and verifiable offline.
- **Alternatives considered:** Global python environment, poetry/conda. Standard pip + venv was selected for minimal barrier and fast CI/local setup.

## 2026-10-25 - D002: Null Company and Role in Resume Output
- **Decision:** Top-level `company` and `role` fields in `resume_parse_result` are always set to `null` for resumes.
- **Reason:** Resumes represent candidate profiles rather than specific target postings; target company/role are JD properties (Role 1) or user selection (Role 3/4).
- **Alternatives considered:** Infer target role from "Preferred Roles", but that would violate the data contract where candidate preferred roles can be multiple. Flagged for team review in `contract/CHANGELOG.md`.

## 2026-10-25 - D003: Rich Objects for Hackathons and Internships in Prefill
- **Decision:** Structured objects `{ "title", "result", "kind", "description" }` and `{ "role", "organization", "description" }` are used within `profile_prefill.hackathons` and `profile_prefill.internships`.
- **Reason:** Role 3 (Profile Builder) needs rich pre-fill fields to populate structured form inputs rather than plain unformatted strings.
- **Alternatives considered:** Plain string arrays. Rich objects provide much higher utility while remaining easily serializable to strings if needed.

## 2026-10-25 - D004: Ingestion Strategy & Real Sample Text Artifacts
- **Decision:** Use `pdfplumber` with automatic fallback to `pymupdf` (modern import, avoiding deprecated `fitz`) for PDFs, and `python-docx` traversing paragraphs and tables for DOCX.
- **Observed Text Artifacts from 8 Sample Files:**
  1. *Page Headers/Footers:* Rohan's PDF contains `"RADIX Talent Match Hackathon · Test Data"` at the top and `"Page 1"` at the bottom.
  2. *Hyphenated Line Breaks:* e.g., `"horizontally-\nscalable workers"`.
  3. *Leaked Fit-Labels:* Line 2 in all samples contains synthetic assessment labels (e.g., `"Systems-leaning generalist..."`). Must never be treated as skill evidence.
  4. *Bullet Glyphs:* PDFs contain Unicode bullets (`•`), DOCX files contain plain paragraphs or em-dashes (`—`).
  5. *Zero Contact Information:* No email or phone exists in any sample resume; warnings must be emitted, never hallucinated.
  6. *Placeholder Strings:* `"Self-taught via applied projects; no formal certifications listed"` and `"None listed"` must resolve to `certifications: []`.
  7. *Magic Byte Validation:* Inspect file magic header (`%PDF-` for PDF, `PK\x03\x04` for DOCX) in addition to extension to reject corrupt or disguised files.

## 2026-10-25 - D005: Category Summary as Raw Signal, Not Scoring
- **Decision:** `category_summary` provides raw rollup metrics (skill_count, strongest_confidence, strongest_evidence, has_evidence) per RADIX category. `suggested_manual_additions` identifies gaps. We do NOT compute 1–10 readiness levels.
- **Reason:** The scoring definition belongs to Role 4 (Talent Check) per the hackathon brief. Computing levels here would violate scope boundaries and risk inconsistency with Role 4's formula.
- **Alternatives considered:** Providing a "strength score" per category, or a "level" field. Rejected because it encroaches on Role 4's responsibility and the brief explicitly says level computation is theirs.

## 2026-10-25 - D006: Optional OCR and Source-Origin Signals
- **Decision:** Attempt OCR only after both embedded-text PDF extractors return no text. Render pages with PyMuPDF and call optional `pytesseract`/Tesseract through Pillow; if unavailable or failing, preserve a schema-valid empty parse with an explicit warning.
- **Reason:** Scanned PDFs are a Tier 3 enhancement, while the core parser must remain usable without a system OCR binary or API access.
- **Alternatives considered:** Making OCR mandatory, which would make clean-checkout installation and CI fragile; or silently skipping scanned PDFs, which would hide a material extraction limitation.
- **Decision:** Add `source_kind` to every emitted skill and infer it from an explicit extractor value first, then the source section, with `unknown` as the safe fallback.
- **Reason:** Downstream roles can weight project, internship, certification, and achievement evidence without guessing from free-form section names. Unknown is safer than inventing provenance.

## 2026-10-25 - D007: Replay Cache for Final Demo
- **Decision:** Use `LLM_MODE=replay` in the cache warmer and final demo instructions rather than making a live provider call part of release verification.
- **Reason:** The final regression must be deterministic and offline; the recorded responses exercise the same extraction and downstream validation path without exposing keys or depending on provider availability during the presentation.
- **Alternatives considered:** Live-only warming, which adds latency and quota/network risk; or rule-based-only warming, which would not exercise the integrated LLM replay path used by the demo.

## 2026-10-25 - D008: Normalize Provider Content Blocks
- **Decision:** Normalize every provider response through `content_to_text`, preserving strings and joining only blocks whose type is `text`.
- **Reason:** Gemini and other LangChain integrations may return multimodal content-block lists; treating those replies as strings causes `.strip()` and JSON parsing failures.
- **Alternatives considered:** Calling `str()` on the list, which would retain Python representation noise and non-text blocks; or handling Gemini only, which would leave the shared client/provider chain inconsistent.

## 2026-10-25 - D009: Section-Complete p2 Extraction and Grounded Aliases
- **Decision:** Version the extraction prompt as p2 and require an ordered pass over every detected section and bullet, including combined hackathon/internship sections. Named tools, protocols, and standards require literal or taxonomy-alias evidence; only supported general concepts may be inferred.
- **Reason:** Live Gemini responses were missing skills from later sections and incorrectly converting generic phrases such as "API layer" into the named protocol "REST APIs".
- **Decision:** Extend deterministic taxonomy aliases for generic signals such as multithreading/concurrency and rate limiting, remove the unsafe "API layer" REST alias, and strip leading bullet glyphs from emitted evidence.
- **Reason:** Dictionary extraction should capture supported concepts without asking the LLM to invent named technologies, while evidence should remain clean and directly groundable.
- **Decision:** Print missed implied-skill names in eval reports and re-record p2 fixtures from live Gemini, retaining a deterministic segmented-name fallback when the provider omits the name.
- **Reason:** Recall failures must be actionable and replay fixtures must reflect the live provider behavior used by the eval.

## 2026-10-25 - D010: Structured Dropped-Skill Diagnostics
- **Decision:** Grounding drops now emit `meta.dropped_skills` entries containing `skill_name`, `claimed_evidence`, and `reason`, alongside the warning `Dropped unsupported skill`.
- **Reason:** Unseen-resume review needs the rejected claim and a machine-readable explanation, not only a log string.

## 2026-10-25 - D011: Conservative Column-Aware Ingestion
- **Decision:** PDF pages use word-coordinate gutters only when a clear vertical whitespace band separates columns; detected full-width header lines remain first, followed by each column top-to-bottom from left to right. DOCX body XML is walked in document order so tables remain between surrounding paragraphs.
- **Reason:** Multi-column resumes otherwise interleave unrelated sections, while ordinary pages must retain the existing extractor behavior when no reliable gutter exists.

## 2026-10-25 - D012: p3 Grounding Rules and Coursework Provenance
- **Decision:** Prompt p3 uses neutral type-based category definitions, requires resume wording or taxonomy canonical names, requires one contiguous supporting quote, and counts education coursework at low confidence with `source_kind="coursework"`.
- **Reason:** Avoid sample-resume tuning while preserving useful, explicitly bounded evidence from coursework.

## 2026-10-25 - D013: Provider-Quota Fixture Fallback
- **Decision:** Attempt the p3 live re-recording first; when Gemini returned service-unavailable, retired-model, and quota-exhausted responses, seed deterministic p3 replay fixtures from the prior live snapshots and record that provenance in each fixture.
- **Reason:** Keep offline regression and evaluation reproducible without claiming that quota-blocked responses were newly recorded live.

## 2026-10-25 - D014: Education Prefill and Header-Safe Column Boundaries
- **Decision:** Select education prefill from the first education-keyword line, otherwise format `education_details`, and emit `No education entry found` when neither source exists. Column detection now scores repeated per-line gutters and separates same-line header blocks before reading columns left-to-right.
- **Reason:** Full-width contact/objective lines were hiding the gutter and contaminating education with nearby job titles; the same contamination also mislabeled unrelated skills as coursework and affected name extraction.
- **Verification:** Replay and no-LLM checks now return correct name, email, phone, and education for the two affected unseen resumes, with no coursework mislabels. The four sample education strings remain byte-identical.

## 2026-10-25 - D015: Complete Structured Education Prefill
- **Decision:** Treat a short or degree-only education line as a selector, then compose the prefill from the first non-empty structured education entry as `degree, field, institution, year — GPA/CGPA value`. Preserve a sufficiently complete raw line, and preserve the safe selected line when structured entries are empty.
- **Reason:** Split-column layouts expose `B.S.` before the remaining education details; structured fallback restores the field, institution, year, and grade without changing the established sample strings.
- **Verification:** Replay and no-LLM outputs for both affected unseen resumes now include complete education summaries. Split-line and empty-structured-entry regressions pass.

## 2026-10-25 - D016: Preserve Full Degrees and Header Names in Dictionary Parsing
- **Decision:** Keep the resume's complete degree wording, splitting `of`/`in`/`degree in` phrases into degree and field while preserving abbreviations exactly. Join up to three consecutive name-like header tokens, using large PDF font metadata when available and a text-only fallback otherwise.
- **Decision:** Extend the deterministic taxonomy with common engineering, virtualization, network-analysis, endpoint, shell, operating-system, and hardware-diagnostics tools so skills-list recall does not depend on an LLM.
- **Reason:** The two unseen PDFs exposed truncated degree/name fields and low no-LLM skill recall; these are layout and vocabulary gaps rather than resume-specific rules.
- **Verification:** No-LLM and explicit replay-mode runs return full names, full education entries, and multiple skills for both unseen PDFs; neither education section starts with a job title and neither has coursework-labeled skills. All tests and `eval/eval.py` pass; sample names/education strings, `gold/`, and evaluation thresholds remain unchanged.

## 2026-10-25 - D017: Prompt p4 and Strict Live Recording Boundaries
- **Decision:** Replace sample-derived prompt examples with neutral invented scenarios, describe RADIX categories by capability type, and bump the prompt version to p4.
- **Decision:** Cache keys now hash the complete system-plus-user prompt before combining it with the prompt version and model, preventing an edited system prompt from reusing an older answer.
- **Decision:** The recording script uses only Gemini with no failover, stops on any error, waits five seconds between files, prints recording metadata, and writes fixtures only for uncached Gemini responses. Existing migrated snapshot markers remain because this run made no live calls; the p4 replay keys are explicit offline migrations.
- **Verification:** Offline replay fixtures and tests use p4 keys; no live LLM call was made. `gold/` and evaluation thresholds are unchanged.

## 2026-10-25 - D018: Consensus Name Selection
- **Decision:** Treat the LLM name, dictionary/segmented name, and font-aware ingest name as competing candidates. Validate each candidate, require one to four name-like tokens, reject digits, section headings, and job-title words, then prefer the longest email-consistent candidate that contains shorter candidates as tokens.
- **Reason:** A non-empty one-token LLM name previously prevented the fuller PDF header name from reaching `profile_prefill`, even when the email supported the missing surname.
- **Verification:** Mocked short-name and stacked-header regressions pass; the four sample names remain byte-identical. No live calls were made, and `gold/` and evaluation thresholds are unchanged.

## 2026-10-26 - D019: Null-safe Details and Stable Upload Failures
- **Decision:** Treat missing nested detail strings as nullable, derive untitled project names from description words, and validate each detail item independently so malformed items are dropped with `meta.parse_warnings` while skills and profile core remain available.
- **Decision:** Use shared friendly error messages and classifications for API and CLI handling of unreadable, unsupported, and oversized files; keep technical parse details in server logs.
- **Decision:** Emit provider-chain warnings in the form `<provider> failed: <reason>; used <fallback>` whenever failover succeeds.
- **Verification:** Mock, replay, and no-live tests pass; Role 3 fixtures validate, schema `1.3` is exported, and `eval/eval.py` passes. `gold/` and evaluation thresholds are unchanged.

## 2026-10-26 - D020: Taxonomy v1.1 and Canonical Skill Sections
- **Decision:** Extend the shared taxonomy with general programming-language, tool, database, cloud, and communication coverage. Very short names such as `C`, `C#`, `R`, and `Go` are exact, case-sensitive extractor matches only and are excluded from dictionary free-text scanning.
- **Decision:** Normalize heading variants and skill provenance to the canonical section set: `skills`, `education`, `projects`, `experience`, `hackathons`, `certifications`, `achievements`, and `other`.
- **Reason:** The own-resume replay exposed missing categories for `Luau` and `Team Collaboration` and raw `SKILL` provenance. The change is vocabulary- and heading-general, not resume-specific.
- **Verification:** Cached p4 output was reprocessed without a live provider call. The four sample names, education strings, skill names, categories, counts, `gold/`, and evaluation thresholds remain unchanged; only requested source-section/source-kind metadata is canonicalized. `pytest -q` and replay evaluation pass.
