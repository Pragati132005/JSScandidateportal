# RADIX Talent Match - Role 1: JD Analytics

This module implements **Role 1 (JD Analytics)** for the RADIX Talent Match Hackathon.
It extracts structured technical skills, tools, and competencies from Job Descriptions (PDF, DOCX, or TXT) using **Google Gemini** (via Google AI Studio) and maps them onto the **12 RADIX Skill Categories**.

---

## 📁 Project Architecture

```
jd-analytics/
├── .env                              # Stores your GEMINI_API_KEY
├── requirements.txt                  # Python dependencies
├── README.md                         # Documentation & Team guide
├── data/
│   └── sample_jds/                   # 6 Official Hackathon JDs (.pdf & .docx)
│       ├── Google LLC - Software Engineer.pdf
│       ├── Google LLC - Data Scientist.pdf
│       ├── Microsoft - Software Engineer.pdf
│       ├── Microsoft - Data Analyst.pdf
│       ├── Oracle - Associate Software Engineer.pdf
│       └── Oracle - Application Support Analyst.pdf
├── outputs/
│   └── extracted_jds/                # Standardized JSON handoff files for Role 5
│       ├── google_llc_-_software_engineer.json
│       ├── google_llc_-_data_scientist.json
│       ├── microsoft_-_software_engineer.json
│       ├── microsoft_-_data_analyst.json
│       ├── oracle_-_associate_software_engineer.json
│       ├── oracle_-_application_support_analyst.json
│       └── extraction_summary.json
└── src/
    ├── __init__.py                   # Package exports for team imports
    ├── schema.py                     # Pydantic data contracts (Pages 9 & 10)
    ├── document_parser.py            # PDF (pypdf) & DOCX (python-docx) extractor
    ├── prompts.py                    # Structured LLM prompt targeting 12 categories
    ├── extractor.py                  # Core Gemini / LLM / Heuristic extractor
    ├── batch_runner.py               # Batch processor for all sample JDs
    ├── cli.py                        # Terminal CLI runner
    └── api.py                        # Optional FastAPI service for React/web UI
```

---

## 🏷️ The 12 RADIX Skill Categories

Every extracted skill is classified into one of the 12 official codes (or `OTHER`):
* `COD` – Coding & Programming Languages
* `DSA` – Data Structures & Algorithms
* `OOD` – Object-Oriented Design & Patterns
* `APTI` – Aptitude & Analytical Problem Solving
* `COMM` – Communication & Team Collaboration
* `AI` – Artificial Intelligence & Machine Learning
* `CLOUD` – Cloud & DevOps (AWS, GCP, Azure, K8s, Docker)
* `SQL` – Databases & Querying (SQL, NoSQL, Schemas)
* `SWE` – Software Engineering Practices (Git, Testing, CI/CD)
* `SYSD` – System Design & Scalability
* `NETW` – Networking & Protocols (TCP/IP, HTTP, REST, gRPC)
* `OS` – Operating Systems & Concurrency (Linux, Threads, Memory)
* `OTHER` – Special domain skills

---

## 🚀 How to Run

### 1. Extract a Single JD File (CLI)
```bash
# Print extracted JSON to terminal
python -m src.cli "data/sample_jds/Google LLC - Software Engineer.pdf"

# Or save directly to a file
python -m src.cli "data/sample_jds/Google LLC - Software Engineer.pdf" -o my_output.json
```

### 2. Batch Process All 6 Sample JDs
```bash
python -m src.batch_runner
```
Outputs are automatically written to `outputs/extracted_jds/`.

### 3. Using as a Python Module (For Role 5: Skill Matching)
Your teammates can import your extractor directly:
```python
from src.extractor import JDExtractor

extractor = JDExtractor()
output = extractor.extract_from_file("path/to/job_description.pdf")

print(output.company)        # "Google LLC"
print(output.role)           # "Software Engineer (SWE)"
print(len(output.skills))    # 10 skills

# Iterate through extracted skills
for skill in output.skills:
    print(f"[{skill.category_code}] {skill.skill_name}: {skill.evidence}")
```

### 4. Run as a REST API (For React Frontend)
```bash
uvicorn src.api:app --reload --port 8000
```
* **Interactive Docs:** `http://localhost:8000/docs`
* **Upload Endpoint:** `POST /api/extract-jd` (accepts file upload)
* **Raw Text Endpoint:** `POST /api/extract-jd-text` (accepts JSON with raw text)

---

## 📋 JSON Schema Contract (Role 1 Handoff)

```json
{
  "source_type": "jd",
  "source_file": "Google LLC - Software Engineer.pdf",
  "company": "Google LLC",
  "role": "Software Engineer (SWE)",
  "skills": [
    {
      "skill_name": "Data Structures & Algorithms",
      "category_code": "DSA",
      "evidence": "Strong grasp of data structures and algorithms...",
      "confidence": "high"
    }
  ]
}
```
