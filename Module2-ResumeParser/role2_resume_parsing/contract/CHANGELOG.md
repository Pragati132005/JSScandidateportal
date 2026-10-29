# Contract Changelog & Open Questions for Team

## Version 1.4 (2026-10-26) - Taxonomy v1.1 and canonical sections
- Extended the team taxonomy with common programming languages, tools, databases, cloud services, and communication skills.
- Marked ambiguous entries explicitly and restricted very short language names to exact, case-sensitive extractor matches.
- Normalized section labels and skill provenance to the canonical section set: `skills`, `education`, `projects`, `experience`, `hackathons`, `certifications`, `achievements`, and `other`.

## Version 1.3 (2026-10-26) - Null-safe details and stable upload errors
- Made optional nested detail fields tolerant of missing resume data.
- Added item-level validation warnings and project-title derivation from descriptions.
- Added consistent friendly API/CLI messages for unreadable, unsupported, and oversized files.
- Added provider-failover warnings that identify the failed provider and fallback provider.

## Version 1.2 (2026-10-25) — M14: OCR fallback and source-weighted signals
Backwards-compatible additions for scanned PDFs and downstream evidence weighting.

### New Fields
- **`skills[].source_kind`**: Semantic origin of a skill signal: `skills_list`, `project`,
  `internship`, `experience`, `certification`, `achievement`, `coursework`, or `unknown`.
- **`meta.parser_version`**: Updated to `1.2` for the M14 parser behavior.

### OCR Behavior
- Textless PDFs attempt OCR only when the optional `pytesseract`, `Pillow`, and system
  Tesseract executable are available.
- If OCR is unavailable or fails, parsing continues with an empty text input and an
  explicit warning; text-based resume parsing is unaffected.

## Version 1.1 (2026-10-25) — M13: Tier 2 Evidence-Gap Detection & Category Summary
Backwards-compatible additions to support Role 4 (Talent Check) scoring input.

### New Fields
- **`category_summary`** (top-level, `Dict[str, CategorySummaryItem]`): Rollup metrics for each of the 12 RADIX categories. Each item contains:
  - `category_code`: One of the 12 RADIX category codes.
  - `skill_count`: Number of skills extracted in this category.
  - `strongest_confidence`: Highest confidence level among the skills (`high`, `medium`, or `low`; `null` if no skills).
  - `strongest_evidence`: Evidence string from the strongest skill; `null` if no skills.
  - `has_evidence`: `true` if at least one skill exists in the category.
- **`meta.categories_without_evidence`** (existed in v1.0 as a warning list; now formally populated from the category summary analysis).
- **`meta.suggested_manual_additions`** (new): List of RADIX category codes where the candidate should self-add skills (e.g., APTI, CLOUD). This is raw input for Role 4 — we do **not** compute 1–10 levels (that's Role 4's responsibility).

### Note for Role 4 / Downstream
The `category_summary` provides the raw signal (skill count, evidence strength) per category. **Do not** use it to compute readiness levels directly — that scoring definition belongs to Role 4. The `suggested_manual_additions` list highlights areas where the resume has no evidence, suggesting the candidate fill in the gap manually in the Profile Builder.

---

## Version 1.3 (2026-10-25) — Evidence Diagnostics and Coursework Provenance
- Added `meta.dropped_skills` audit entries for unsupported skill claims.
- Added `coursework` as a permitted `Skill.source_kind` for low-confidence education evidence.

## Version 1.0 (2026-10-25)
Initial output contract for Role 2 (Resume Parsing), exported to `resume_parse_result.schema.json`.

### Structure Overview
1. **Top-Level Compatibility:**
   - `schema_version`: String tracking contract version (`"1.0"`).
   - `source_type`: Set to `"resume"`.
   - `source_file`: Filename of the source document (e.g., `Rohan_Verma.pdf`).
   - `company`: `null` (Resumes are candidate-centric; target company belongs to JD analytics in Role 1 or user selection).
   - `role`: `null` (Target role belongs to JD in Role 1; candidate's preferred roles are inside `profile_prefill.preferred_roles`).
   - `skills`: Array of 12-category RADIX skills with evidence and confidence.

2. **`profile_prefill` (Pre-fill object for Role 3: Profile Builder):**
   - Matches Role 3 profile fields: `name`, `email`, `education`, `skills`, `hackathons`, `internships`, `certifications`, `preferred_roles`, `cv_file`.
   - Enables Role 3 to load candidate data into the profile form without any glue code.

3. **`details` (Extended Candidate Data):**
   - Includes `phone`, `links`, structured `education_details`, `projects` with technologies, structured `experience`, and `achievements`.

4. **`meta` (Execution and Audit Trace):**
   - Parser versions, LLM model used, cache status, parsing warnings, unevidenced categories, and processing latency.

---

### Open Questions for Team Review

1. **Company & Role as null:**
   - *Proposal:* Resumes leave top-level `company` and `role` as `null`, since candidates are not tied to a single target job at parse time.
   - *Impact on Role 4 / 5:* Downstream modules should take `company` and `role` from the chosen JD (Role 1), not from the resume output.

2. **Structured Objects vs Strings for Hackathons and Internships:**
   - *Proposal:* `profile_prefill.hackathons` contains `{ "title", "result", "kind", "description" }` and `profile_prefill.internships` contains `{ "role", "organization", "description" }`.
   - *Question for Role 3:* Does Role 3 prefer these structured objects to pre-fill multi-field forms, or does it require string-serialized representations?

3. **Additive Fields:**
   - `evidence_verified`, `source_section`, `details`, `category_summary`, and `meta` are additive. Teammates who only need the brief's standard fields can safely ignore them.
