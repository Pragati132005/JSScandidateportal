# RADIX Talent Check — Module 4

Standalone Python/FastAPI module that accepts a saved Module 3 profile and selected company, compares evidence-backed candidate proficiency with company expectations across all 12 RADIX skill categories, and returns the agreed JSON contract.

## Important implementation choices

- **Plain, inspectable scoring code**; no LLM is used to assign levels. The hackathon brief says Talent Check should primarily use plain code (brief pp. 8, 13).
- **Evidence before labels**: profile skills, project descriptions, internships, certifications, achievements and related fields are evaluated against the supplied 10-level topic dictionary. Generic skill-name mentions do not by themselves establish advanced proficiency.
- **Differentiation**: two candidates who both say “basic Python” can receive different levels when one has only a bare mention and the other provides applied project evidence. A profile's explicitly supplied `level` is used only if Module 3 intentionally provides it; otherwise the level is inferred from evidence.
- **No invented company data**: benchmark values are parsed from the company table's leading 1–10 number (e.g. `8-CR` -> `8`). Suffixes such as `CR`, `EV`, `AS`, `AP`, `CU` are not interpreted as skill levels.
- **12-category response** in stable order: `COD`, `DSA`, `OOD`, `APTI`, `COMM`, `AI`, `CLOUD`, `SQL`, `SWE`, `SYSD`, `NETW`, `OS`.
- `gap` is `true` only when `candidate_level < required_level`.
- Readiness is the mean of each category's normalized progress above the floor: `max(candidate_level - 1, 0) / max(required_level - 1, 1)`, capped at 1, scaled to 0–100 and rounded. This makes a profile with no evidence score 0 instead of receiving artificial readiness from the minimum level. Categories are equally weighted because the brief does not provide weights.
- The API returns the canonical company name from the source table. Company matching allows a unique partial name but rejects ambiguous matches.
- Strict Supabase source mode is the default. Missing credentials, permission errors, empty tables, invalid schemas, and failed reads stop the request; no silent CSV fallback occurs. For offline tests only, explicitly set `TALENT_CHECK_SOURCE_MODE=csv`. Supabase reads use stable `id` ordering, pagination, row caps, and permission-specific errors.

## Repository layout

```text
talent_check/
  api.py             FastAPI routes
  config.py          Environment configuration
  repository.py      Supabase/CSV data source and validation
  schemas.py         Input/output contracts
  scoring.py         Evidence inference, benchmark parsing and scoring
data/
  staging_skill_topics.csv
  staging_company_skill_levels.csv
examples/             Four sample candidate profiles as extracted text
tests/                Regression and edge-case tests
```

## Setup (Windows PowerShell)

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` with the Supabase project URL and server-side key. Do not commit `.env`, expose a service-role key in React, or share it in client-side code. If the Supabase tables are readable by a restricted backend role, prefer that over a service-role key.

The CSVs are local development snapshots and are not used unless `TALENT_CHECK_SOURCE_MODE=csv` is explicitly set. The table names default to `staging_skill_topics` and `staging_company_skill_levels`, matching the supplied file stems. If your actual Supabase table names differ, change the two environment variables. This repository does not contain credentials, so live connectivity must be verified in your environment.

## Run

```powershell
py -m uvicorn talent_check.api:app --reload
```

- Health: http://127.0.0.1:8000/health
- Available companies: http://127.0.0.1:8000/companies
- Swagger UI: http://127.0.0.1:8000/docs
- POST endpoint: http://127.0.0.1:8000/talent-check
- Candidate-specific explanations: POST http://127.0.0.1:8000/talent-check/details (adds explanation fields; base endpoint preserves the exact shared JSON contract)
- Data-source verification: http://127.0.0.1:8000/health/data

## Module 3 request contract

```json
{
  "company": "Google LLC",
  "profile": {
    "name": "Ananya Rao",
    "skills": [
      {
        "skill_name": "C++",
        "category_code": "COD",
        "evidence": "Implemented a multithreaded job scheduler in C++"
      }
    ],
    "projects": [
      "Built a distributed URL-shortening service with a Redis-backed cache and horizontally-scalable API"
    ],
    "internships": ["Backend intern; shipped a production rate-limiter"]
  }
}
```

The endpoint accepts extra profile fields so it can integrate with Module 3 without needing to strip fields that Module 4 does not use. Skills may be objects or strings. Prefer skill objects with `skill_name`, `category_code`, `evidence`, and optional `confidence`.

## Output contract

```json
{
  "company": "Google LLC (Subsidiary of Alphabet Inc.)",
  "skillset_gap": [
    {
      "category_code": "COD",
      "required_level": 8,
      "candidate_level": 6,
      "gap": true
    }
  ],
  "readiness_score": 0
}
```

The sample shows the shape only; real responses contain exactly 12 category rows and a calculated score.

## Validation and edge cases covered

- Empty profile and missing skills -> all categories conservatively default to level 1, rather than treating missing evidence as competence.
- Unknown company -> HTTP 422 with available company names; no fabricated benchmark.
- Ambiguous company substring -> HTTP 422 with guidance to use the exact canonical name.
- Duplicate company rows / duplicate skill-topic rows: company lookup rejects non-unique matches; duplicate topic rows cannot inflate a score because matching levels are stored in a set.
- Invalid or missing benchmark level suffix -> numeric leading level parsed; missing/non-numeric benchmark defaults to 1 (flag this data for cleanup before production).
- Malformed optional candidate level -> ignored; explicit level constrained to 1–10 by request schema when provided through typed skill objects.
- Unknown category -> ignored for category-specific scoring rather than misattributed to a known category.
- Missing evidence, low confidence, keyword-only claims -> conservative levels; evidence matching uses topics from the supplied CSV.
- Stable 12-category output even when profile lacks categories.
- Readiness bounded 0–100; candidate levels bounded 1–10; gap boolean is consistent with levels.
- Supabase read errors fail clearly; with `TALENT_CHECK_SOURCE_MODE=supabase`, missing credentials fail closed.
- Pagination avoids silently truncating large Supabase tables.

## Test

```powershell
py -m pytest -q
```

## Integration note

Module 3 should POST the saved profile and selected company to `/talent-check`. Module 4 returns JSON; the Profile Builder can render `readiness_score` and each `skillset_gap` item. Keep this API contract shared between team members. In a production deployment, restrict CORS to the portal origin and protect `/admin/reload-data`.

## Resolving source and scoring quality issues

### 1. Connect the real Supabase project

Strict Supabase mode is the default. Copy `.env.example` to `.env` and replace the placeholders with your project's HTTPS URL and server-side key. Never commit `.env`; use a server-side key with least privilege and appropriate table permissions/RLS. This environment does not contain your project credentials, so a live connection cannot be authenticated from this build environment. Verify it locally with:

```powershell
py -m uvicorn talent_check.server:app --reload
# In another terminal:
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://127.0.0.1:8000/data-health
```

`/data-health` reads and validates both configured sources. A successful health endpoint alone may not prove table access; `/data-health` must succeed. Source mode can be set to `csv` only for local/offline tests.

### 2. Resolve duplicate company benchmark rows

Do not pick a duplicate row based on row order. Run `sql/diagnose_duplicate_company_benchmarks.sql` in Supabase SQL Editor and compare each row's 12 levels with the authoritative RADIX source. Confirm the correct row with the data owner, then correct or remove the erroneous row in Supabase and the local CSV snapshot. The repository intentionally rejects duplicate exact company matches. No authoritative values were supplied to this code change, so it does not fabricate a replacement benchmark for ZS Associates.

Run a read-only local diagnostic with `TALENT_CHECK_SOURCE_MODE=csv` set:

```powershell
$env:TALENT_CHECK_SOURCE_MODE = "csv"
py scripts/check_data_quality.py
```

### 3. Validate estimator quality against expert labels

The estimator is deterministic and evidence/rubric-based, but automated tests are not a substitute for labelled evaluation. Two reviewers should independently score actual profile evidence, reconcile differences, and create `calibration/gold_profiles.jsonl` using the schema in `calibration/README.md`. Then run:

```powershell
$env:TALENT_CHECK_SOURCE_MODE = "csv"
py scripts/evaluate_calibration.py calibration/gold_profiles.jsonl
```

Do not mark template data as adjudicated. The evaluator refuses profiles not explicitly marked as adjudicated. Report MAE and within-one-level accuracy on a held-out set before claiming empirical validation.
