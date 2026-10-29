# Integration Guide: Role 2 (Resume Parsing)

This document provides clear integration instructions for teammates building **Role 3 (Profile Builder)**, **Role 4 (Talent Check)**, and **Role 5 (Skill Matching)**.

---

## 1. Fast Overview for Downstream Modules

Role 2 extracts grounded skills and structured candidate profiles from resumes in **PDF** and **DOCX** formats.

### Integration Options
1. **HTTP API:** `POST http://localhost:8000/parse-resume` (Multipart file upload)
2. **Python Import:**
   ```python
   from resume_parser.pipeline import parse_resume

   result = parse_resume("path/to/resume.pdf")
   # result is a Pydantic ResumeParseResult model
   data = result.model_dump()
   ```

`parse_resume()` returns a validated `ResumeParseResult` Pydantic model, not a plain
dictionary. Use `model_dump()` for a Python dictionary or `model_dump_json()` for JSON.
3. **CLI:**
   ```bash
   python -m resume_parser.cli parse resume.pdf --out output.json
   ```

---

## 2. Integration with Role 3 (Profile Builder)

Role 2 outputs a dedicated `profile_prefill` object that **directly pre-fills** the Role 3 candidate profile form without requiring transformation code.

### Prefill Payload Shape
```json
{
  "profile_prefill": {
    "name": "Rohan Verma",
    "email": null,
    "education": "B.Tech, Computer Science and Engineering, Class of 2026 — CGPA 9.1 / 10",
    "skills": [
      {
        "skill_name": "System Design",
        "category_code": "SYSD",
        "evidence": "Designed and built a scalable notification service",
        "confidence": "high",
        "evidence_verified": true,
        "source_section": "projects"
      }
    ],
    "hackathons": [
      {
        "title": "National inter-college hackathon",
        "result": "Winner",
        "kind": "hackathon",
        "description": "built a real-time collaborative document editor"
      }
    ],
    "internships": [
      {
        "role": "Software Engineering intern",
        "organization": "Series-B startup",
        "description": "shipped a feature end-to-end including tests and CI"
      }
    ],
    "certifications": [],
    "preferred_roles": ["Software Engineer", "Data Scientist", "Backend Engineer"],
    "cv_file": "Rohan_Verma.pdf"
  }
}
```

### Form Hydration in React (Role 3 Example)
```javascript
async function handleResumeUpload(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:8000/parse-resume', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  const prefill = data.profile_prefill;

  // Hydrate React Form State
  setName(prefill.name || '');
  setEmail(prefill.email || '');
  setEducation(prefill.education || '');
  setSkills(prefill.skills || []);
  setHackathons(prefill.hackathons || []);
  setInternships(prefill.internships || []);
  setCertifications(prefill.certifications || []);
  setPreferredRoles(prefill.preferred_roles || []);
}
```

---

## 3. Integration with Role 5 (Skill Matching)

Role 5 compares candidate skills against JD requirements.

### Key Fields for Matcher
- `skills[i].skill_name`: Canonical skill name normalized against the team taxonomy (v1).
- `skills[i].category_code`: One of the 12 team category codes (`COD`, `DSA`, `OOD`, `APTI`, `COMM`, `AI`, `CLOUD`, `SQL`, `SWE`, `SYSD`, `NETW`, `OS`, or `OTHER`).
- `skills[i].confidence`: `"high" | "medium" | "low"`.
- `skills[i].evidence_verified`: `true` if verbatim evidence was verified in source text.
- `skills[i].source_kind`: Provenance such as `skills_list`, `project`, `internship`, `experience`, `certification`, `achievement`, `coursework`, or `unknown`.
- `meta.categories_without_evidence`: Explicit list of team category codes where the candidate has no evidence.
- `meta.dropped_skills`: Structured claims rejected during evidence grounding, including the claimed evidence and rejection reason.
- `schema_version`: Current output contract version, currently `"1.3"`.

### Shared Taxonomy
Role 2 uses the team taxonomy (v1) from `shared/taxonomy/taxonomy_v1.json`. Role 1 should
load the same file when integrated; naming consistency between JD and resume skills is
not guaranteed until Role 1 loads this shared file.

---

## 4. API Errors

`POST /parse-resume` returns an error JSON body with this exact shape:

```json
{
  "error": "unreadable_file",
  "message": "This file couldn’t be read. It may be empty or corrupted."
}
```

Status codes are:
- `422`: empty, unreadable, or corrupt PDF/DOCX.
- `415`: unsupported file type.
- `413`: upload exceeds the maximum file size.
- `500`: unexpected server-side failure.

The standalone API reads `PORT` from the environment and defaults to `8000`.
It reads comma-separated browser origins from `CORS_ORIGINS`; the defaults are
`http://localhost:5173,http://localhost:3000`.

## 5. Open Contract Questions for Team Alignment

1. **Company & Role:** Always `null` in resume parse output since resumes are candidate-centric. Role 5 takes target `company` and `role` from the chosen JD.
2. **Hackathons & Internships Format:** We provide structured objects `{title, result, kind, description}`. If Role 3 prefers plain string arrays, let us know!
3. **Contact Warnings:** Real student resumes frequently omit email/phone. Role 2 surfaces `parse_warnings` and sets `email: null` instead of hallucinating.
