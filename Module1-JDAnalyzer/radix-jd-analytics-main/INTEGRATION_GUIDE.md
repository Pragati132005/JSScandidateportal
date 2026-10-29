# 🤝 Integration Guide for RADIX Talent Match Team

This guide is for **Role 5 (Skill Matching)**, **Role 3 (Profile Builder)**, and the **Scrum Master** to integrate **Role 1 (JD Analytics)** into the shared pipeline.

---

## 1. Quickest Way: Use Pre-Extracted JSONs (No Setup Needed!)

If you just want to test your modules immediately without running LLM calls, all 6 sample JDs are already parsed and stored in:
`outputs/extracted_jds/`

* `google_llc_-_software_engineer.json`
* `google_llc_-_data_scientist.json`
* `microsoft_-_software_engineer.json`
* `microsoft_-_data_analyst.json`
* `oracle_-_associate_software_engineer.json`
* `oracle_-_application_support_analyst.json`

### To load in Python:
```python
import json

with open("outputs/extracted_jds/google_llc_-_software_engineer.json", "r") as f:
    jd_data = json.load(f)

# jd_data is ready for Role 5 Skill Matching!
print(jd_data["company"])      # "Google LLC"
print(jd_data["role"])         # "Software Engineer (SWE)"
print(jd_data["skills"])       # List of skills with category_code, evidence, confidence
```

---

## 2. In-Code Python Integration (Role 5 Direct Call)

If Role 5 wants to extract skills on the fly from an uploaded JD:

```python
from src.extractor import JDExtractor

extractor = JDExtractor()
jd_output = extractor.extract_from_file("path/to/any_job_description.pdf")

# Returns validated JDExtractionOutput
for skill in jd_output.skills:
    print(skill.skill_name, skill.category_code, skill.confidence)
```

---

## 3. Microservice / REST API (For React Frontend)

If the team wants a backend endpoint for the React UI:

1. Start server:
   ```bash
   uvicorn src.api:app --reload --port 8000
   ```
2. Frontend sends multipart POST request to `http://localhost:8000/api/extract-jd`:
   * Body: `file` (PDF or DOCX)
   * Response: JSON with exact RADIX schema contract.
