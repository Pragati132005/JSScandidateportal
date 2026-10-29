# RADIX Talent Match — JSS Candidate Portal

## 9. How to Run Our Code

Evaluators should be able to run your tool from `Code.zip` using only these steps.

| Field | Instructions / Values |
| :--- | :--- |
| **Prerequisites** | **Python**: 3.10+ (tested on Python 3.12 / 3.13 / 3.14)<br>**Node.js**: 18.0+ (tested on Node.js v20 / v22 / v25) & `npm` |
| **Setup commands** | **Install all dependencies:**<br>`cd Module1-JDAnalyzer/radix-jd-analytics-main && pip install -r requirements.txt`<br>`cd ../../Module2-ResumeParser/role2_resume_parsing && pip install -r requirements.txt`<br>`cd ../../Module4-TalentCheck && pip install -r requirements.txt`<br>`cd ../Module5-SkillMatch/role5 && pip install -r requirements.txt`<br>`cd ../../profilebackend && pip install -r requirements.txt`<br>`cd ../Module3-ProfileBuilder/JSScandidateportal-profilebuilder && npm install` |
| **Environment variables** | • `GEMINI_API_KEY` *(optional — for live LLM extraction; offline rule-based & replay fallbacks run automatically without keys)*<br>• `DATABASE_URL` *(PostgreSQL connection string for candidate profile persistence)*<br>• `TALENT_CHECK_SOURCE_MODE=csv` *(defaults to local benchmark dataset)*<br>• `ROLE5_API_BASE_URL` *(optional — proxied by Vite by default)* |
| **Start command(s)** | **Windows PowerShell (One-Click Start):**<br>`powershell -ExecutionPolicy Bypass -File .\start-all-services.ps1`<br><br>**Manual Start (Individual Terminals):**<br>1. **Module 3 (Web UI):** `cd Module3-ProfileBuilder/JSScandidateportal-profilebuilder && npm run dev` *(Runs on `http://localhost:5173`)*<br>2. **Profile Backend:** `python -m uvicorn profilebackend.main:app --host 127.0.0.1 --port 8040`<br>3. **Module 1 (JD Analytics):** `cd Module1-JDAnalyzer/radix-jd-analytics-main && python -m uvicorn src.api:app --host 127.0.0.1 --port 8020`<br>4. **Module 2 (Resume Parser):** `cd Module2-ResumeParser/role2_resume_parsing && python -m uvicorn resume_parser.api:app --host 127.0.0.1 --port 8000`<br>5. **Module 4 (Talent Check):** `cd Module4-TalentCheck && python -m uvicorn talent_check.api:app --host 127.0.0.1 --port 8010`<br>6. **Module 5 (Skill Match):** `cd Module5-SkillMatch/role5 && python -m uvicorn app.main:app --host 127.0.0.1 --port 8030` |
| **Sample data location** | • **Job Descriptions (JDs):** `Module1-JDAnalyzer/radix-jd-analytics-main/data/sample_jds/`<br>• **Candidate Resumes:** `Module2-ResumeParser/role2_resume_parsing/data/resumes/` & `Module3-ProfileBuilder/JSScandidateportal-profilebuilder/priya_menon.parse.json`<br>• **Company Benchmark Datasets:** `Module4-TalentCheck/data/staging_company_skill_levels.csv` & `staging_skill_topics.csv`<br>• **Role 1 & Role 3 Integration Fixtures:** `Module5-SkillMatch/role5/sample_data/` |

## Role 5 Skill-Matching integration

The portal should call the deployed Role 5 API after it has received the Role 1
JD Analytics result and the Role 3 Candidate Profiling result.

Set the portal environment variable below to the public URL of the deployed
Role 5 service (do not include a trailing slash):

```text
ROLE5_API_BASE_URL=https://<your-role5-host>
```

Send the integration request to:

```text
POST ${ROLE5_API_BASE_URL}/api/v1/skill-match
Content-Type: application/json
```

```json
{
  "role1": "<the complete Role 1 JD Analytics JSON object>",
  "role3": "<the complete Role 3 Candidate Profiling JSON object>"
}
```

`role1_jd_analytics` and `role3_candidate_profiling` are equivalent accepted
field names. The service health endpoint is
`${ROLE5_API_BASE_URL}/health` (also available at `/api/v1/health`).

The Role 5 service accepts browser-originated requests, so no proxy is needed
solely for CORS. Handle non-2xx responses in the portal and display the API's
JSON validation message when present.
