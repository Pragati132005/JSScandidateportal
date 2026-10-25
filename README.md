# RADIX Talent Match — Profile Builder Module

**RADIX Talent Match** is an intelligent recruitment-technology platform designed to bridge the gap between job market demands and technical candidate qualifications through verifiable skills, granular taxonomies, and deterministic matching.

This repository contains **Module 3: Profile Builder**, responsible for candidate profile creation, multi-section enrichment, evidence linkage, RADIX technical skill coding, and client-side JSON interoperability.

---

## 1. The 5-Module Hackathon Pipeline

The RADIX platform is partitioned into five specialized, interoperable modules:

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     Module 1: JD Analytics      │       │    Module 2: Resume Parsing     │
│ Analyzes job descriptions and   │       │ Extracts raw candidate data     │
│ extracts normalized RADIX       │       │ from multi-format resumes       │
│ requirement vectors.            │       │ into structured JSON.           │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 │                                         ▼
                 │                        ┌─────────────────────────────────┐
                 │                        │    Module 3: Profile Builder    │
                 │                        │ (Current Standalone Module)     │
                 │                        │ Candidate verification,         │
                 │                        │ evidence linkage, RADIX coding, │
                 │                        │ and profile enrichment.         │
                 │                        └────────────────┬────────────────┘
                 │                                         │
                 │                        ┌────────────────┴────────────────┐
                 │                        ▼                                 ▼
                 │        ┌─────────────────────────────────┐   ┌─────────────────────────────┐
                 │        │     Module 4: Talent Check      │   │  Module 5: Skill Matching   │
                 │        │ Validates candidate evidence,   │   │ Matches candidate profiles  │
                 │        │ authenticates credentials, and  │   │ against JD Analytics        │
                 │        │ performs integrity checks.      │   │ vectors to compute score.   │
                 └───────►└─────────────────────────────────┘   └─────────────────────────────┘
```

1. **Module 1: JD Analytics**
   Deconstructs job descriptions into role archetypes, mandatory competencies, and weighted RADIX skill requirement vectors.
2. **Module 2: Resume Parsing**
   Parses unstructured resumes (PDF/DOCX) into structured JSON. While currently disconnected in this standalone stage, an authoritative intake adapter and synthetic fixture validate intake readiness.
3. **Module 3: Profile Builder (This Module)**
   An independent, offline-first client application where candidates curate personal info, education, preferred roles, projects, internships, certifications, and standardized skills with verifiable evidence.
4. **Module 4: Talent Check**
   Consumes exported candidate JSON to verify project artifacts, repository commits, certification badges, and evidence integrity.
5. **Module 5: Skill Matching**
   Calculates multi-dimensional alignment scores and skill gap analyses by matching the Profile Builder's candidate vector against the JD Analytics requirement vector.

---

## 2. Canonical CandidateProfile JSON Contract

Downstream modules (Talent Check and Skill Matching) expect candidate data structured exactly as follows:

```typescript
export interface CandidateProfile {
  schema_version: '1.0.0';
  profile_id: string;
  last_updated: string; // ISO 8601 string
  personal_info: {
    full_name: string;
    email: string;
    phone: string;
    location: string;
    headline: string;
    summary: string;
    links: {
      linkedin?: string;
      github?: string;
      portfolio?: string;
      other?: string;
    };
  };
  preferred_roles: {
    target_roles: string[];
    job_types: string[];
    preferred_locations: string[];
    expected_salary_currency?: string;
    expected_salary_range?: string;
    notice_period_days?: number;
  };
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field_of_study: string;
    start_year: string;
    end_year: string;
    gpa_or_grade?: string;
    highlights?: string;
  }>;
  skills: Array<{
    id: string;
    skill_name: string;
    category_code: RadixCategoryCode;
    evidence: string;
    confidence: SkillConfidence;
  }>;
  projects: Array<{
    id: string;
    title: string;
    role: string;
    description: string;
    technologies: string[];
    live_url?: string;
    repo_url?: string;
    start_date?: string;
    end_date?: string;
    highlights: string[];
  }>;
  internships_and_experience: Array<{
    id: string;
    company: string;
    title: string;
    location: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
    description: string;
    technologies: string[];
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    issue_date: string;
    expiration_date?: string;
    credential_id?: string;
    credential_url?: string;
  }>;
}
```

### Approved RADIX Technical Skill Taxonomies

All skills must be categorized into one of 13 approved category codes:

| Code | Domain | Description |
| :--- | :--- | :--- |
| **`COD`** | Coding & Scripting | Core programming languages, scripting, idiomatic syntax |
| **`DSA`** | Data Structures & Algorithms | Algorithmic complexity, tree/graph traversals, dynamic programming |
| **`OOD`** | Object-Oriented Design | SOLID principles, design patterns, encapsulation, domain models |
| **`APTI`** | Quantitative Aptitude | Analytical reasoning and quantitative problem-solving |
| **`COMM`** | Communication & Soft Skills | Technical writing, collaboration, stakeholder articulation |
| **`AI`** | Artificial Intelligence & ML | Machine learning, deep learning, NLP, LLM tools, embeddings |
| **`CLOUD`**| Cloud & DevOps | AWS/GCP/Azure, Docker, Kubernetes, CI/CD orchestration |
| **`SQL`** | Databases & SQL | Relational design, indexing, ACID transactions, NoSQL stores |
| **`SWE`** | Software Engineering Practices | Version control (Git), unit/integration testing, code reviews |
| **`SYSD`** | System Design & Scalability | Distributed systems, caching, microservices, load balancing |
| **`NETW`** | Networking & Security | OSI model, HTTP/S, WebSockets, tokens, network security |
| **`OS`** | Operating Systems & Low-Level | Processes, threads, memory management, Linux systems |
| **`OTHER`**| Other Technical & Domain | Unclassified technical tools, hardware, UI/UX, domain tools |

### Skill Confidence Tiers

* **`high`**: Demonstrated production or complex system application with verifiable evidence.
* **`medium`**: Solid conceptual grounding with academic or coursework project application.
* **`low`**: Foundational or unverified skill pending Talent Check verification.

---

## 3. Synthetic Example Candidate Profile JSON

Below is a complete synthetic JSON profile representing a valid export:

```json
{
  "schema_version": "1.0.0",
  "profile_id": "radix-cand-sample-2026",
  "last_updated": "2026-10-25T00:30:00.000Z",
  "personal_info": {
    "full_name": "Alex Rivera",
    "email": "alex.rivera@example.com",
    "phone": "+1 (555) 234-5678",
    "location": "San Francisco, CA (Open to Remote)",
    "headline": "Senior Full Stack Engineer & Distributed Systems Specialist",
    "summary": "Full-stack software engineer with 5+ years of experience designing scalable web applications, real-time distributed pipelines, and cloud-native microservices.",
    "links": {
      "linkedin": "https://linkedin.com/in/alexrivera-sample",
      "github": "https://github.com/alexrivera-sample",
      "portfolio": "https://alexrivera.dev",
      "other": "https://leetcode.com/alexrivera"
    }
  },
  "preferred_roles": {
    "target_roles": ["Senior Full Stack Engineer", "Distributed Systems Engineer"],
    "job_types": ["full-time", "remote"],
    "preferred_locations": ["San Francisco, CA", "Remote (Global)"],
    "expected_salary_currency": "USD",
    "expected_salary_range": "$160,000 - $190,000",
    "notice_period_days": 14
  },
  "education": [
    {
      "id": "edu-1",
      "institution": "University of California, Berkeley",
      "degree": "Bachelor of Science",
      "field_of_study": "Computer Science & Data Engineering",
      "start_year": "2018",
      "end_year": "2022",
      "gpa_or_grade": "3.86 / 4.00",
      "highlights": "Dean's Honors List, TA for CS61B Data Structures"
    }
  ],
  "skills": [
    {
      "id": "sk-1",
      "skill_name": "TypeScript & React",
      "category_code": "COD",
      "evidence": "Architected telemetry dashboard handling 50k+ daily metrics: github.com/alexrivera-sample/telemetry-ui",
      "confidence": "high"
    },
    {
      "id": "sk-2",
      "skill_name": "Distributed Systems & Event-Driven Architecture",
      "category_code": "SYSD",
      "evidence": "Designed idempotent Apache Kafka event bus processing 12,000 events/sec with partition failover.",
      "confidence": "high"
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "title": "AetherPulse - Distributed Real-Time Telemetry Pipeline",
      "role": "Lead Architect & Full Stack Engineer",
      "description": "High-throughput stream processing pipeline ingesting IoT telemetry data.",
      "technologies": ["TypeScript", "Node.js", "Apache Kafka", "Docker"],
      "live_url": "https://aetherpulse-demo.internal",
      "repo_url": "https://github.com/alexrivera-sample/aetherpulse-pipeline",
      "start_date": "2023-01",
      "end_date": "2023-08",
      "highlights": ["Zero message loss under 10k/sec load", "Deployed multi-region cluster"]
    }
  ],
  "internships_and_experience": [
    {
      "id": "exp-1",
      "company": "Nexus Distributed Labs",
      "title": "Senior Software Engineer (Backend & Infrastructure)",
      "location": "San Francisco, CA",
      "start_date": "2022-07",
      "end_date": "",
      "is_current": true,
      "description": "Spearheaded core real-time streaming infrastructure.",
      "technologies": ["Go", "TypeScript", "Kafka", "PostgreSQL", "Docker"]
    }
  ],
  "certifications": [
    {
      "id": "cert-1",
      "name": "AWS Certified Solutions Architect - Associate",
      "issuer": "Amazon Web Services (AWS)",
      "issue_date": "2023-03",
      "credential_id": "AWS-ASA-9948201",
      "credential_url": "https://aws.amazon.com/verification"
    }
  ]
}
```

---

## 4. Module Interoperability (Export & Import)

### Exporting for Downstream Modules
1. Click **Export** in the top navigation toolbar or **Export JSON** on an individual candidate card in the Profile Manager.
2. The browser automatically downloads a canonical JSON file: `radix_profile_<candidate_name>_<date>.json`.
3. Downstream modules (Talent Check and Skill Matching) can ingest this JSON directly via standard `JSON.parse()` or file input.

### Importing from Other Modules or Backups
1. Click **Import** in the header or in the Profile Manager view.
2. Drag and drop or browse for a `.json` candidate file.
3. The Profile Builder strictly validates:
   - Schema version compatibility (`1.0.0`).
   - All 13 RADIX category codes and 3 confidence values.
   - Verifiable skill evidence.
   - Structural integrity and file size boundaries (max 5 MB).
4. **Duplicate ID Collision Protection**:
   If the incoming `profile_id` exists in local storage, you are prompted to:
   - **Import with New ID (Recommended)**: Preserves imported candidate data under a fresh unique ID.
   - **Overwrite Existing Profile**: Explicitly updates the existing record.
   - **Cancel**: Leaves existing storage completely untouched.

---

## 5. Resume Adapter Contract (Module 2 Intake)

The Resume Adapter (`src/features/profile-builder/services/resumeAdapter.ts`) normalizes raw extraction data from Module 2 (Resume Parsing) into the canonical Profile contract.

### Expected Input Contract (`ParsedResumeInput`)
```typescript
export interface ParsedResumeInput {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  links?: { linkedin?: string; github?: string; portfolio?: string };
  target_roles?: string[];
  education?: Array<{ institution: string; degree: string; field_of_study: string; start_year: string; end_year: string; gpa?: string }>;
  skills?: Array<{ name: string; categoryHint?: string; evidenceHint?: string; confidence?: 'high' | 'medium' | 'low' }>;
  projects?: Array<{ title: string; role: string; description: string; technologies: string[]; repo_url?: string; highlights?: string[] }>;
  experience?: Array<{ company: string; title: string; location: string; start_date: string; end_date: string; is_current: boolean; description: string }>;
  certifications?: Array<{ name: string; issuer: string; issue_date: string }>;
}
```

### Resume Intake Behavior:
- Accepts `.pdf` and `.docx` documents up to 5 MB.
- In standalone mode, prominently notifies the user that the AI parsing engine is offline and employs an authoritative synthetic fixture.
- Uncertain categories map to `OTHER` without guessing.
- Unsupported confidence tiers map to `low` without guessing.
- Missing fields (salary, notice period) remain blank for candidate manual review.

---

## 6. LocalStorage Architecture & Limitations

The Profile Builder currently uses browser `localStorage` under two dedicated keys:
- Profiles Store: `radix_talent_match_profiles_v1`
- Active Profile Pointer: `radix_talent_match_active_id_v1`

### Key Characteristics & Limitations:
- **Client & Device Local**: Data stored in `localStorage` is isolated to the specific browser and origin. Clearing browser cookies or cache removes local profiles.
- **Quota Resilience**: Storage quota errors (`QuotaExceededError`) are caught gracefully via `StorageQuotaError` without corrupting working drafts.
- **Per-Record Fault Tolerance**: Corrupt entries in `localStorage` are safely skipped without failing the entire profile collection.
- **Service Isolation**: All persistence operations pass strictly through `LocalStorageProfileAdapter` implementing `ProfileStorageAdapter`. Presentation components never access `window.localStorage` directly.

---

## 7. Assumptions & Next Steps for Team Backend / Supabase Integration

Before connecting Supabase or a PostgreSQL database in Stage 6, the hackathon team should align on:
1. **User Authentication & Ownership**: Map `profile_id` to `auth.users.id` in Supabase Auth (UUID v4).
2. **Schema Version Migrations**: How version upgrades (`1.0.0` -> `1.1.0`) will be handled via database migration scripts.
3. **Database Normalization vs. Document Storage**: Whether candidate profiles should be stored as normalized relational tables (`candidate_profiles`, `skills`, `education`, `projects`) or as a JSONB column matching `CandidateProfile`.
4. **Downstream API Endpoints**: REST/tRPC endpoints for Module 4 (Talent Check) and Module 5 (Skill Matching) to fetch verified candidate vectors by `profile_id`.
5. **Storage Adapter Replacement**: Swapping `LocalStorageProfileAdapter` with a `SupabaseProfileAdapter` adhering to the existing `ProfileStorageAdapter` interface without modifying UI components.

---

## 8. Development & Verification Commands

```bash
# 1. Start local development server
npm run dev

# 2. Run all unit and round-trip automated test suites (Stage 3, 4, and 5)
npm test

# 3. Run zero-warning linter
npm run lint

# 4. Run TypeScript check and production bundle build
npm run build
```
