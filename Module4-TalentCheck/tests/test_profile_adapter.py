
from talent_check.profile_adapter import adapt_profile


def test_adapts_module3_saved_profile():
    payload = {
        "company": "Wipro Limited",
        "profile": {
            "schema_version": "1.0.0",
            "profile_id": "test-candidate-1",
            "personal_info": {
                "full_name": "Test Candidate",
                "email": "candidate@example.com",
                "summary": "Python developer with project experience",
            },
            "skills": [
                {
                    "skill_name": "Python",
                    "category_code": "COD",
                    "evidence": "Built a Python application",
                    "confidence": "high",
                }
            ],
            "projects": [{"name": "Python Application"}],
            "education": [{"degree": "B.Tech"}],
            "internships_and_experience": [
                {"company": "Example Company", "role": "Intern"}
            ],
            "certifications": [],
        },
    }

    result = adapt_profile(payload)

    assert result["name"] == "Test Candidate"
    assert result["email"] == "candidate@example.com"
    assert result["summary"] == "Python developer with project experience"
    assert len(result["skills"]) == 1
    assert len(result["projects"]) == 1
    assert len(result["education"]) == 1
    assert len(result["internships"]) == 1
    assert result["profile_id"] == "test-candidate-1"

from talent_check.scoring import score_profile


def test_module3_profile_can_be_scored():
    payload = {
        "company": "Wipro Limited",
        "profile": {
            "profile_id": "integration-test-1",
            "personal_info": {
                "full_name": "Test Candidate",
                "summary": "Built a Python application and wrote SQL queries",
            },
            "skills": [
                {
                    "skill_name": "Python",
                    "category_code": "COD",
                    "evidence": "Built a Python application",
                    "confidence": "high",
                },
                {
                    "skill_name": "SQL",
                    "category_code": "SQL",
                    "evidence": "Wrote SQL queries",
                    "confidence": "medium",
                },
            ],
            "projects": [
                {
                    "name": "Python Application",
                    "description": "Built and tested a Python application",
                    "technologies": ["Python", "SQL"],
                }
            ],
            "education": [{"degree": "B.Tech"}],
            "internships_and_experience": [],
            "certifications": [],
        },
    }

    from talent_check.profile_adapter import adapt_profile

    profile = adapt_profile(payload)
    result = score_profile(profile, payload["company"])

    assert result["company"] == "Wipro Limited"
    assert len(result["skillset_gap"]) == 12
    assert {
        item["category_code"] for item in result["skillset_gap"]
    } == {
        "COD", "DSA", "OOD", "APTI", "COMM", "AI",
        "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS",
    }
    assert 0 <= result["readiness_score"] <= 100
