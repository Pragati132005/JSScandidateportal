
"""Adapter for Module 3 saved-profile JSON.

Normalizes Module 3 fields for Module 4 while preserving the original data.
"""
from collections.abc import Mapping


def adapt_profile(payload):
    if not isinstance(payload, Mapping):
        raise ValueError(
            "Request must be a JSON object containing a candidate profile."
        )

    # Support both {"profile": {...}, "company": "..."} and direct profiles.
    raw = payload.get("profile", payload)

    if not isinstance(raw, Mapping):
        raise ValueError("profile must be a JSON object.")

    profile = dict(raw)

    # Module 3 keeps candidate details inside personal_info.
    personal_info = profile.get("personal_info", {})
    if not isinstance(personal_info, Mapping):
        personal_info = {}

    if not profile.get("name"):
        profile["name"] = (
            personal_info.get("full_name")
            or personal_info.get("name")
            or ""
        )

    if not profile.get("email"):
        profile["email"] = personal_info.get("email", "")

    if not profile.get("summary"):
        profile["summary"] = personal_info.get("summary", "")

    # Normalize Module 3 aliases into the fields Module 4 reads.
    aliases = {
        "projects": ("projects", "project", "project_details"),
        "internships": (
            "internships",
            "internship",
            "internships_and_experience",
            "experience",
        ),
        "certifications": ("certifications", "certificates"),
        "skills": ("skills", "technical_skills", "skillset"),
        "education": ("education", "educational_details"),
        "hackathons": ("hackathons", "hackathon"),
    }

    for target, keys in aliases.items():
        if target not in profile or profile[target] is None:
            for key in keys:
                value = profile.get(key)
                if value is not None:
                    profile[target] = value
                    break

    # Ensure collection fields have predictable types.
    for key in (
        "skills",
        "projects",
        "hackathons",
        "internships",
        "certifications",
        "education",
    ):
        value = profile.get(key)

        if value is None:
            profile[key] = []
        elif not isinstance(value, list):
            profile[key] = [value]

    # Keep the original Module 3 data; no fields are deliberately removed.
    return profile
