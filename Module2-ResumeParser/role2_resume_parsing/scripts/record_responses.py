"""Generate and save live Gemini responses for the 4 sample candidates.

Run this script deliberately when prompt or model behavior changes. The resulting
responses enable offline execution in LLM_MODE=replay without consuming quota.
"""

import json
import os
import sys
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from shared.ingest import extract_text
from shared.clean import clean_text
from resume_parser.segment import segment_resume
from resume_parser.prompts import PROMPT_VERSION, SYSTEM_PROMPT_P4, build_user_prompt
from shared.cache import ResponseCache, compute_cache_key
from shared.llm_client import LLMClient


CANDIDATE_DATA = {
    "Ananya Rao": {
        "name": "Ananya Rao",
        "email": None,
        "phone": None,
        "links": [],
        "education": [
            {
                "degree": "B.Tech",
                "field": "Computer Science and Engineering",
                "institution": None,
                "graduation_year": 2026,
                "grade": "8.6 / 10",
                "grade_scale": "CGPA",
            }
        ],
        "skills": [
            {"skill_name": "C++", "category_code": "COD", "evidence": "C++, Python, Java, Data Structures & Algorithms", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Python", "category_code": "COD", "evidence": "C++, Python, Java, Data Structures & Algorithms", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Java", "category_code": "COD", "evidence": "C++, Python, Java, Data Structures & Algorithms", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Data Structures & Algorithms", "category_code": "DSA", "evidence": "Data Structures & Algorithms, Operating Systems, Computer Networks", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Operating Systems", "category_code": "OS", "evidence": "Operating Systems, Computer Networks, Object-Oriented Design", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Computer Networks", "category_code": "NETW", "evidence": "Operating Systems, Computer Networks, Object-Oriented Design", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Object-Oriented Design", "category_code": "OOD", "evidence": "Object-Oriented Design, Git, Linux", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Git", "category_code": "SWE", "evidence": "Object-Oriented Design, Git, Linux", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Linux", "category_code": "OS", "evidence": "Object-Oriented Design, Git, Linux", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "System Design", "category_code": "SYSD", "evidence": "Built a distributed URL-shortening service with a Redis-backed cache and a horizontally-scalable API layer", "confidence": "medium", "source_section": "projects"},
            {"skill_name": "Redis", "category_code": "OTHER", "evidence": "Built a distributed URL-shortening service with a Redis-backed cache", "confidence": "medium", "source_section": "projects"},
            {"skill_name": "Design Patterns", "category_code": "OOD", "evidence": "Designed a parking-lot management system in Java using OOP design patterns (Factory, Strategy)", "confidence": "medium", "source_section": "projects"},
            {"skill_name": "Process Scheduling", "category_code": "OS", "evidence": "simulating OS-level process scheduling algorithms (Round Robin, Priority, SJF)", "confidence": "medium", "source_section": "projects"},
            {"skill_name": "Testing", "category_code": "SWE", "evidence": "shipped a rate-limiter used in production", "confidence": "medium", "source_section": "internships"},
            {"skill_name": "Competitive Programming", "category_code": "DSA", "evidence": "Solved 350+ problems on competitive programming platforms", "confidence": "medium", "source_section": "achievements"},
            {"skill_name": "Mentoring", "category_code": "COMM", "evidence": "mentors juniors on DSA through the college coding club", "confidence": "low", "source_section": "achievements"},
        ],
        "projects": [
            {"title": "Distributed URL-shortening service", "description": "Redis-backed cache and horizontally-scalable API layer as capstone systems project", "technologies": ["Redis", "API"]},
            {"title": "Multithreaded job scheduler", "description": "simulating OS-level process scheduling algorithms in C++", "technologies": ["C++", "Multithreading"]},
            {"title": "Parking-lot management system", "description": "using OOP design patterns in Java", "technologies": ["Java", "OOP"]},
        ],
        "experience": [
            {"role": "Summer intern, backend team", "organization": "mid-size product startup", "description": "shipped a rate-limiter used in production"}
        ],
        "hackathons": [
            {"title": "National-level 24-hour hackathon", "result": "Finalist", "kind": "hackathon", "description": "built a real-time chat backend"}
        ],
        "internships": [
            {"role": "Summer intern, backend team", "organization": "mid-size product startup", "description": "shipped a rate-limiter used in production"}
        ],
        "certifications": [],
        "achievements": [
            "Solved 350+ problems on competitive programming platforms",
            "mentors juniors on DSA through the college coding club"
        ],
        "preferred_roles": ["Software Engineer", "Backend Engineer"],
    },
    "Karthik Subramaniam": {
        "name": "Karthik Subramaniam",
        "email": None,
        "phone": None,
        "links": [],
        "education": [
            {
                "degree": "B.Tech",
                "field": "Computer Science and Engineering",
                "institution": None,
                "graduation_year": 2026,
                "grade": "8.2 / 10",
                "grade_scale": "CGPA",
            }
        ],
        "skills": [
            {"skill_name": "SQL", "category_code": "SQL", "evidence": "SQL, Python (pandas, scikit-learn), Power BI", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Python", "category_code": "COD", "evidence": "SQL, Python (pandas, scikit-learn), Power BI", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "pandas", "category_code": "OTHER", "evidence": "Python (pandas, scikit-learn)", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "scikit-learn", "category_code": "AI", "evidence": "Python (pandas, scikit-learn)", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Power BI", "category_code": "OTHER", "evidence": "Power BI, Statistics, A/B testing basics, Excel, basic Java", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Statistics", "category_code": "OTHER", "evidence": "Power BI, Statistics, A/B testing basics, Excel, basic Java", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "A/B Testing", "category_code": "OTHER", "evidence": "Power BI, Statistics, A/B testing basics, Excel, basic Java", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Excel", "category_code": "OTHER", "evidence": "Excel, basic Java", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Java", "category_code": "COD", "evidence": "Excel, basic Java", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Machine Learning", "category_code": "AI", "evidence": "feature engineering → logistic regression model on a public e-commerce dataset", "confidence": "medium", "source_section": "projects"},
            {"skill_name": "Schema Design", "category_code": "SQL", "evidence": "Designed a normalized schema and dashboard for a college event-management system", "confidence": "medium", "source_section": "projects"},
            {"skill_name": "Dashboards", "category_code": "OTHER", "evidence": "built two recurring dashboards used by the growth team", "confidence": "medium", "source_section": "internships"},
            {"skill_name": "Anomaly Detection", "category_code": "OTHER", "evidence": "anomaly detection on registration spikes", "confidence": "medium", "source_section": "projects"},
            {"skill_name": "Presenting", "category_code": "COMM", "evidence": "presenting results to a non-technical audience", "confidence": "medium", "source_section": "projects"},
        ],
        "projects": [
            {"title": "Churn-prediction pipeline", "description": "SQL extraction -> feature engineering -> logistic regression model", "technologies": ["SQL", "scikit-learn"]},
            {"title": "Event-management system", "description": "normalized schema, dashboard, and anomaly detection", "technologies": ["SQL", "Dashboards"]},
            {"title": "A/B test simulation", "description": "comparing onboarding flows and presenting to non-technical audience", "technologies": ["A/B Testing"]},
        ],
        "experience": [
            {"role": "Data Analytics intern", "organization": "fintech startup", "description": "built two recurring dashboards used by the growth team"}
        ],
        "hackathons": [
            {"title": "Inter-college data visualization competition", "result": "Runner-up", "kind": "competition", "description": "data visualization competition"}
        ],
        "internships": [
            {"role": "Data Analytics intern", "organization": "fintech startup", "description": "built two recurring dashboards used by the growth team"}
        ],
        "certifications": ["Google Data Analytics Certificate"],
        "achievements": [
            "Published a short analysis write-up on a public dataset, featured in a college newsletter"
        ],
        "preferred_roles": ["Data Analyst", "Data Scientist"],
    },
    "Priya Menon": {
        "name": "Priya Menon",
        "email": None,
        "phone": None,
        "links": [],
        "education": [
            {
                "degree": "B.Tech",
                "field": "Information Technology",
                "institution": None,
                "graduation_year": 2026,
                "grade": "7.4 / 10",
                "grade_scale": "CGPA",
            }
        ],
        "skills": [
            {"skill_name": "SQL", "category_code": "SQL", "evidence": "SQL (basic), Java, Linux basics", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Java", "category_code": "COD", "evidence": "SQL (basic), Java, Linux basics", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Linux", "category_code": "OS", "evidence": "SQL (basic), Java, Linux basics", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Computer Networks", "category_code": "NETW", "evidence": "Networking fundamentals, MS Excel, exposure to ticketing tools", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Excel", "category_code": "OTHER", "evidence": "Networking fundamentals, MS Excel, exposure to ticketing tools", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Ticketing Tools", "category_code": "OTHER", "evidence": "exposure to ticketing tools", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "MySQL", "category_code": "SQL", "evidence": "Built a simple student attendance tracker using Java and a MySQL backend", "confidence": "medium", "source_section": "projects"},
            {"skill_name": "Troubleshooting and Escalations", "category_code": "OTHER", "evidence": "handled first-level troubleshooting and escalations", "confidence": "medium", "source_section": "internships"},
            {"skill_name": "Communication", "category_code": "COMM", "evidence": "coordinating logistics across teams", "confidence": "low", "source_section": "achievements"},
        ],
        "projects": [
            {"title": "Student attendance tracker", "description": "using Java and MySQL backend for college project", "technologies": ["Java", "MySQL"]},
            {"title": "College helpdesk simulation project", "description": "resolving simulated tickets and logging resolutions", "technologies": ["Ticketing Tools"]},
        ],
        "experience": [
            {"role": "Summer intern, IT support desk", "organization": "local business", "description": "handled first-level troubleshooting and escalations"}
        ],
        "hackathons": [
            {"title": "12-hour campus hackathon", "result": "Participated (non-finalist)", "kind": "hackathon", "description": "Participated in 12-hour campus hackathon"}
        ],
        "internships": [
            {"role": "Summer intern, IT support desk", "organization": "local business", "description": "handled first-level troubleshooting and escalations"}
        ],
        "certifications": ["Cisco Networking Basics (online course)"],
        "achievements": [
            "Volunteer coordinator for a college technical fest, coordinating logistics across teams"
        ],
        "preferred_roles": ["Application Support Analyst", "Associate Software Engineer"],
    },
    "Rohan Verma": {
        "name": "Rohan Verma",
        "email": None,
        "phone": None,
        "links": [],
        "education": [
            {
                "degree": "B.Tech",
                "field": "Computer Science and Engineering",
                "institution": None,
                "graduation_year": 2026,
                "grade": "9.1 / 10",
                "grade_scale": "CGPA",
            }
        ],
        "skills": [
            {"skill_name": "C++", "category_code": "COD", "evidence": "C++, Python, SQL, Data Structures & Algorithms, System Design", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Python", "category_code": "COD", "evidence": "C++, Python, SQL, Data Structures & Algorithms, System Design", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "SQL", "category_code": "SQL", "evidence": "C++, Python, SQL, Data Structures & Algorithms, System Design", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Data Structures & Algorithms", "category_code": "DSA", "evidence": "C++, Python, SQL, Data Structures & Algorithms, System Design", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "System Design", "category_code": "SYSD", "evidence": "Designed and built a scalable notification service (pub-sub architecture, horizontally-scalable workers)", "confidence": "high", "source_section": "projects"},
            {"skill_name": "Object-Oriented Design", "category_code": "OOD", "evidence": "Wrote a technical blog series on object-oriented design patterns used in real-world systems", "confidence": "high", "source_section": "projects"},
            {"skill_name": "Operating Systems", "category_code": "OS", "evidence": "Operating Systems, basic Machine Learning, Git, Docker", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Machine Learning", "category_code": "AI", "evidence": "Built a recommendation engine using collaborative filtering on a movie-ratings dataset, evaluated with precision/recall", "confidence": "high", "source_section": "projects"},
            {"skill_name": "Git", "category_code": "SWE", "evidence": "Operating Systems, basic Machine Learning, Git, Docker", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Docker", "category_code": "SWE", "evidence": "Operating Systems, basic Machine Learning, Git, Docker", "confidence": "high", "source_section": "technical_skills"},
            {"skill_name": "Competitive Programming", "category_code": "DSA", "evidence": "500+ problems solved across competitive programming platforms", "confidence": "medium", "source_section": "achievements"},
            {"skill_name": "Testing and CI", "category_code": "SWE", "evidence": "shipped a feature end-to-end including tests and CI", "confidence": "medium", "source_section": "internships"},
            {"skill_name": "Technical Writing", "category_code": "COMM", "evidence": "Wrote a technical blog series on object-oriented design patterns used in real-world systems", "confidence": "low", "source_section": "projects"},
        ],
        "projects": [
            {"title": "Scalable notification service", "description": "pub-sub architecture, horizontally-scalable workers as a personal system-design project, documented with architecture diagrams", "technologies": ["System Design", "pub-sub"]},
            {"title": "Recommendation engine", "description": "collaborative filtering on a movie-ratings dataset, evaluated with precision/recall", "technologies": ["Machine Learning", "collaborative filtering"]},
            {"title": "Technical blog series", "description": "object-oriented design patterns used in real-world systems", "technologies": ["Object-Oriented Design"]},
        ],
        "experience": [
            {"role": "Software Engineering intern", "organization": "Series-B startup", "description": "shipped a feature end-to-end including tests and CI"}
        ],
        "hackathons": [
            {"title": "National inter-college hackathon", "result": "Winner", "kind": "hackathon", "description": "built a real-time collaborative document editor"}
        ],
        "internships": [
            {"role": "Software Engineering intern", "organization": "Series-B startup", "description": "shipped a feature end-to-end including tests and CI"}
        ],
        "certifications": [],
        "achievements": [
            "500+ problems solved across competitive programming platforms",
            "open-source contributor (2 merged PRs to a mid-size Python library)"
        ],
        "preferred_roles": ["Software Engineer", "Data Scientist", "Backend Engineer"],
    },
}


def record_all():
    cache = ResponseCache(cache_dir="cache", recorded_dir="recorded")
    model_id = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    live_model_id = os.getenv("GEMINI_LIVE_MODEL", model_id)
    client = LLMClient(provider_order=["gemini"], mode="live")
    client.models["gemini"] = live_model_id
    client.cache = ResponseCache(cache_dir="cache/live_recording", recorded_dir="recorded")

    files_processed = 0
    for candidate_name in CANDIDATE_DATA:
        # Process both PDF and DOCX
        formats = [
            (os.path.join("data", "resumes", "PDF", f"{candidate_name}.pdf"), "pdf"),
            (os.path.join("data", "resumes", "Word", f"{candidate_name}.docx"), "docx"),
        ]

        for file_path, fmt in formats:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Expected recording input is missing: {file_path}")

            ingest = extract_text(file_path)
            clean = clean_text(ingest.text)
            seg = segment_resume(clean.text)

            user_prompt = build_user_prompt(
                cleaned_text=clean.text,
                sections=seg.sections,
                non_evidence=seg.non_evidence_lines,
            )

            response = client.generate(
                system_prompt=SYSTEM_PROMPT_P4,
                user_prompt=user_prompt,
                prompt_version=PROMPT_VERSION,
            )
            print(
                f"{candidate_name} ({fmt}): provider={response.provider_used} "
                f"model={response.model_used} prompt_version={PROMPT_VERSION} "
                f"from_cache={response.from_cache}"
            )
            if response.provider_used.lower() != "gemini":
                raise RuntimeError(
                    f"Refusing to record {candidate_name} ({fmt}): "
                    f"unexpected provider {response.provider_used!r}"
                )
            if response.from_cache:
                raise RuntimeError(
                    f"Refusing to record {candidate_name} ({fmt}): response came from cache"
                )
            if response.parsed_json is None:
                raise RuntimeError(f"Gemini returned invalid JSON for {candidate_name} ({fmt})")

            recorded_payload = dict(response.parsed_json)
            if not recorded_payload.get("name") and seg.candidate_name:
                recorded_payload["name"] = seg.candidate_name
            full_prompt = f"{SYSTEM_PROMPT_P4}\n{user_prompt}"
            recorded_model_id = response.model_used or live_model_id
            key = compute_cache_key(full_prompt, PROMPT_VERSION, recorded_model_id)

            cache.put(
                key=key,
                response_text=json.dumps(recorded_payload, ensure_ascii=False),
                meta={
                    "provider": "gemini",
                    "model": recorded_model_id,
                    "candidate": candidate_name,
                    "format": fmt,
                    "prompt_version": PROMPT_VERSION,
                    "from_cache": response.from_cache,
                    "recording_source": "live Gemini",
                },
                as_recorded=True,
            )
            print(f"Recorded response for {candidate_name} ({fmt}) -> recorded/{key}.json")
            files_processed += 1
            if files_processed < len(CANDIDATE_DATA) * len(formats):
                time.sleep(5)


if __name__ == "__main__":
    record_all()
