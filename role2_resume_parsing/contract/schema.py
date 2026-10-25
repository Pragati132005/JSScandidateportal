"""Pydantic schema definitions for Role 2 (Resume Parsing) output contract."""

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field

SourceKind = Literal[
    "skills_list", "project", "internship", "certification", "achievement", "experience", "coursework", "unknown"
]

CategoryCode = Literal[
    "COD",
    "DSA",
    "OOD",
    "APTI",
    "COMM",
    "AI",
    "CLOUD",
    "SQL",
    "SWE",
    "SYSD",
    "NETW",
    "OS",
    "OTHER",
]

ConfidenceLevel = Literal["high", "medium", "low"]


class Skill(BaseModel):
    """Building block skill entry."""
    model_config = ConfigDict(extra="forbid")

    skill_name: str = Field(..., description="Canonical or extracted skill name")
    category_code: CategoryCode = Field(..., description="1 of the 12 RADIX categories or OTHER")
    evidence: str = Field(..., description="Short quote or exact sentence from the source text")
    confidence: ConfidenceLevel = Field(..., description="high, medium, or low")
    evidence_verified: bool = Field(
        default=True,
        description="Whether the evidence quote was verified in source text",
    )
    source_section: Optional[str] = Field(
        default=None,
        description="Section where skill was discovered (e.g. technical_skills, projects)",
    )
    source_kind: SourceKind = Field(
        default="unknown",
        description="Semantic origin type for downstream weighting (skills_list, project, internship, etc.)",
    )


class HackathonItem(BaseModel):
    """Parsed hackathon or competition record."""
    model_config = ConfigDict(extra="forbid")

    title: Optional[str] = Field(default=None, description="Title of hackathon or competition")
    result: Optional[str] = Field(
        default=None,
        description="Result / standing (Winner, Finalist, Runner-up, Participant)",
    )
    kind: Optional[str] = Field(default="hackathon", description="hackathon or competition")
    description: Optional[str] = Field(default=None, description="Project / task description")


class InternshipItem(BaseModel):
    """Parsed internship or work experience entry."""
    model_config = ConfigDict(extra="forbid")

    role: Optional[str] = Field(default=None, description="Internship job role or title")
    organization: Optional[str] = Field(default=None, description="Company or organization name")
    description: Optional[str] = Field(default=None, description="Work description and outcomes")


class ProfilePrefill(BaseModel):
    """Candidate profile shape for Role 3 Profile Builder pre-fill."""
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(default=None, description="Candidate full name")
    email: Optional[str] = Field(default=None, description="Candidate email or null if unlisted")
    education: Optional[str] = Field(
        default=None,
        description="Raw education summary string (e.g. degree, field, graduation year, grade)",
    )
    skills: List[Skill] = Field(
        default_factory=list,
        description="List of extracted candidate skills",
    )
    hackathons: List[HackathonItem] = Field(
        default_factory=list,
        description="Hackathons and competitions",
    )
    internships: List[InternshipItem] = Field(
        default_factory=list,
        description="Internships and industry experience",
    )
    certifications: List[str] = Field(
        default_factory=list,
        description="Formal certifications listed in resume",
    )
    preferred_roles: List[str] = Field(
        default_factory=list,
        description="Target/preferred job roles",
    )
    cv_file: Optional[str] = Field(
        default=None,
        description="Source resume filename",
    )


class EducationDetail(BaseModel):
    """Structured breakdown of education."""
    model_config = ConfigDict(extra="forbid")

    degree: Optional[str] = None
    field: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[int] = None
    grade: Optional[str] = None
    grade_scale: Optional[str] = None


class ProjectDetail(BaseModel):
    """Structured breakdown of project entry."""
    model_config = ConfigDict(extra="forbid")

    title: Optional[str] = None
    description: Optional[str] = None
    technologies: List[Optional[str]] = Field(default_factory=list)


class ExperienceDetail(BaseModel):
    """Structured breakdown of work/experience entry."""
    model_config = ConfigDict(extra="forbid")

    role: Optional[str] = None
    organization: Optional[str] = None
    description: Optional[str] = None


class Details(BaseModel):
    """Extended extracted candidate details."""
    model_config = ConfigDict(extra="forbid")

    phone: Optional[str] = None
    links: List[str] = Field(default_factory=list)
    education_details: List[EducationDetail] = Field(default_factory=list)
    projects: List[ProjectDetail] = Field(default_factory=list)
    experience: List[ExperienceDetail] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)


class CategorySummaryItem(BaseModel):
    """Category rollup summary for Role 4 Talent Check input."""
    model_config = ConfigDict(extra="forbid")

    category_code: CategoryCode
    skill_count: int = 0
    strongest_confidence: Optional[ConfidenceLevel] = None
    strongest_evidence: Optional[str] = None
    has_evidence: bool = False


class DroppedSkill(BaseModel):
    """Audit record for a claimed skill rejected during grounding."""
    model_config = ConfigDict(extra="forbid")

    skill_name: str
    claimed_evidence: str
    reason: str


class ParserMeta(BaseModel):
    """Audit metadata for parser execution."""
    model_config = ConfigDict(extra="forbid")

    parser_version: str = "1.3"
    prompt_version: Optional[str] = "p4"
    taxonomy_version: str = "v1"
    model_used: Optional[str] = None
    from_cache: bool = False
    input_format: Optional[Literal["pdf", "docx"]] = None
    parse_warnings: List[str] = Field(default_factory=list)
    dropped_skills: List[DroppedSkill] = Field(default_factory=list)
    categories_without_evidence: List[CategoryCode] = Field(default_factory=list)
    suggested_manual_additions: List[CategoryCode] = Field(default_factory=list)
    field_confidence: Dict[str, str] = Field(default_factory=dict)
    processing_ms: int = 0


class ResumeParseResult(BaseModel):
    """Top-level contract output for Role 2 (Resume Parsing)."""
    model_config = ConfigDict(extra="forbid")

    schema_version: str = "1.3"
    source_type: Literal["resume"] = "resume"
    source_file: str
    company: Optional[str] = None
    role: Optional[str] = None
    skills: List[Skill] = Field(default_factory=list)
    profile_prefill: ProfilePrefill
    details: Details = Field(default_factory=Details)
    category_summary: Optional[Dict[str, CategorySummaryItem]] = None
    meta: ParserMeta = Field(default_factory=ParserMeta)


def export_json_schema(output_path: str = "contract/resume_parse_result.schema.json") -> None:
    """Export Pydantic schema as a standard JSON Schema file."""
    import json
    schema_dict = ResumeParseResult.model_json_schema()
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(schema_dict, f, indent=2)


if __name__ == "__main__":
    export_json_schema()
