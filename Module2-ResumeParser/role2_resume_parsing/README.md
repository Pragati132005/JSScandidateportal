# Team Talent Match - Role 2: Resume Parsing

Role 2 of the 5-module RADIX Talent Match system. Responsible for ingesting candidate resumes (PDF/DOCX), extracting grounded skills across the 12 RADIX categories, and pre-filling candidate profile data for Role 3 (Profile Builder).

---

## 🚀 Key Features
- **Dual Format Ingest:** High-fidelity text extraction from both PDF (`pdfplumber` with `PyMuPDF` fallback) and DOCX (`python-docx`).
- **Optional OCR:** Textless/image PDFs attempt OCR when `pytesseract`, `Pillow`, and the system Tesseract executable are installed; otherwise parsing continues with a clear warning.
- **12 RADIX Skill Categories:** Deterministic categorization across `COD`, `DSA`, `OOD`, `APTI`, `COMM`, `AI`, `CLOUD`, `SQL`, `SWE`, `SYSD`, `NETW`, `OS`, and `OTHER`.
- **Evidence Grounding:** Every extracted skill is verified against the source text; hallucinated quotes and synthetic fit labels are strictly rejected. Skills also expose `source_kind` (`skills_list`, `project`, `internship`, `experience`, `certification`, or `achievement`) for downstream weighting.
- **Failover & Zero-Cost Offline Replay:** Provider chain (`Gemini` → `Groq` → `OpenRouter` → `Rule-based dictionary fallback`). Runs 100% offline without API keys.
- **Role 3 Direct Integration:** Pre-fills `profile_prefill` directly matching Role 3's candidate profile contract.
- **Adversarial Hardening:** Verified against prompt injection attacks, multi-column layouts, dense multi-page resumes, and unsegmented narrative text.

---

## Integration quickstart

Role 2 is delivered as a self-contained Python module. The public shared
repository does not include the organizer resume or JD pack; place the
organizer files locally under `data/resumes/PDF`, `data/resumes/Word`, and
`data/jds` when running the complete offline eval and fit checks. Only the
synthetic adversarial files are included in `data/adversarial`.

```bash
python -m venv .venv
# Windows: .\.venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set your own provider key in `.env` only if live provider access is required.
Replay, mock, and `--no-llm` modes do not need a key.

Start the standalone API:

```bash
uvicorn resume_parser.api:app --reload --host 0.0.0.0 --port 8000
```

`PORT` defaults to `8000`; set `PORT=9000` to use another port. Configure
browser origins with `CORS_ORIGINS`, a comma-separated list.

Upload a resume using multipart field `file`:

```bash
curl -X POST http://localhost:8000/parse-resume -F "file=@resume.pdf"
```

The response is the complete `ResumeParseResult` JSON object containing
`schema_version`, `profile_prefill`, `details`, `skills`, and `meta`. In Python,
`parse_resume()` returns a validated Pydantic `ResumeParseResult` model; call
`model_dump()` for a dictionary. This delivery has a standalone `app`; the
shared repository has no Python backend to mount a router into. If a Python
host is added later, expose this app as its service or add an explicit router
adapter rather than changing the response contract.

Errors use `{ "error": "...", "message": "..." }`: status `422` means an
empty, unreadable, or corrupt file; `400` or `415` means an unsupported type;
`413` means the 10 MB API limit was exceeded; and `500` is reserved for
unexpected failures.

## 🛠️ Quickstart

### 1. Setup Environment
```bash
# Create virtual environment
python -m venv .venv

# Activate environment (Windows)
.\.venv\Scripts\activate
# (Linux/macOS)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

OCR is optional. Install the Python packages with `pip install pytesseract Pillow`, then install the Tesseract executable separately and ensure `tesseract` is on `PATH`. Text-based PDFs do not use OCR.

### 2. Run Tests
The entire test suite executes completely offline without requiring any API keys:
```bash
pytest -q
```

### 3. Parse a Resume via CLI
```bash
# Parse a resume (defaults to replay/cache mode)
python -m resume_parser.cli parse data/resumes/PDF/Rohan_Verma.pdf --out rohan_parsed.json

# Parse using zero-LLM rule-based dictionary mode
python -m resume_parser.cli parse data/resumes/Word/Ananya_Rao.docx --no-llm
```

### 4. Start the FastAPI Service
```bash
uvicorn resume_parser.api:app --reload --port 8000
```
- Interactive API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: `GET http://localhost:8000/health`
- Resume Upload: `POST http://localhost:8000/parse-resume` (multipart form `file`)

---

## 📊 Evaluation & Quality Gates

Run the automated evaluation harness:
```bash
python eval/eval.py
```
- **Core Recall:** 100.0%
- **Implied Recall:** 100.0%
- **Forbidden Category Violations:** 0
- **Evidence Grounding Rate:** 100.0%
- **PDF vs DOCX Jaccard Stability:** 100.0%

Run the candidate-to-JD fit sanity matrix:
```bash
python eval/fit_sanity.py
```

---

## 📁 Repository Structure
```
resume_parsing/
├── contract/                  # Schema definitions, JSON Schema export, and Role 3 fixtures
│   ├── schema.py
│   ├── resume_parse_result.schema.json
│   ├── CHANGELOG.md
│   └── fixtures/              # Rohan & Priya fixtures for Role 3
├── shared/                    # Reusable modules shared with Role 1
│   ├── ingest.py              # PDF/DOCX ingestion
│   ├── clean.py               # Text cleaning and artifact removal
│   ├── llm_client.py          # Multi-provider client with failover
│   ├── cache.py               # Response caching & replay
│   └── taxonomy.py            # 12 RADIX categories canonical lookup
├── resume_parser/             # Role 2 core implementation
│   ├── segment.py             # Section splitting & fit label isolation
│   ├── prompts.py             # Versioned extraction prompt p1
│   ├── extract.py             # Raw LLM extractor
│   ├── dictionary.py          # Rule-based dictionary parser
│   ├── fuse.py                # Consensus fusion engine
│   ├── postprocess.py         # Grounding & deduplication
│   ├── prefill.py             # Role 3 ProfilePrefill builder
│   ├── pipeline.py            # Single entry point
│   ├── cli.py                 # Command-line interface
│   └── api.py                 # FastAPI service with CORS
├── data/
│   ├── resumes/               # Organizer pack, supplied separately for public repo use
│   └── adversarial/           # Synthetic stress-test resumes (A through F)
├── gold/                      # Ground truth specifications
├── eval/                      # Evaluation harness & reports
├── recorded/                  # Recorded LLM responses for offline execution
├── scripts/                   # Utility scripts (warm_cache, inspect, make_adversarial)
└── tests/                     # Comprehensive test suite (88+ tests)
```
