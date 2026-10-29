"""
RADIX Talent Match - Shared Data Contract (Role 1: JD Analytics)
Strictly adheres to Hackathon Participant Brief (Pages 9 & 10).
Compatible with both Pydantic (if installed) and Python Standard Library (dataclasses).
"""

from enum import Enum
from typing import List, Literal, Optional, Dict, Any

try:
    from pydantic import BaseModel, Field
    HAS_PYDANTIC = True
except ImportError:
    HAS_PYDANTIC = False
    from dataclasses import dataclass, field, asdict


class SkillCategory(str, Enum):
    COD = "COD"      # Coding
    DSA = "DSA"      # Data Structures & Algorithms
    OOD = "OOD"      # Object-Oriented Design
    APTI = "APTI"    # Aptitude
    COMM = "COMM"    # Communication
    AI = "AI"        # Artificial Intelligence
    CLOUD = "CLOUD"  # Cloud
    SQL = "SQL"      # SQL & Databases
    SWE = "SWE"      # Software Engineering
    SYSD = "SYSD"    # System Design
    NETW = "NETW"    # Networking
    OS = "OS"        # Operating Systems
    OTHER = "OTHER"  # Any skill outside the 12 core categories


class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


if HAS_PYDANTIC:
    class SkillItem(BaseModel):
        """Atomic skill block conforming to RADIX data contract."""
        skill_name: str = Field(..., description="The specific skill, framework, or technology")
        category_code: SkillCategory = Field(..., description="One of the 12 RADIX codes or OTHER")
        evidence: str = Field(..., description="A short quote or clear reason from the JD")
        confidence: ConfidenceLevel = Field(default=ConfidenceLevel.HIGH, description="high, medium, or low")

    class JDExtractionOutput(BaseModel):
        """Handoff JSON produced by Role 1 for Role 5 (Skill Matching)."""
        source_type: Literal["jd"] = "jd"
        source_file: str = Field(..., description="Filename or identifier of source JD")
        company: str = Field(..., description="Target company name")
        role: str = Field(..., description="Target job title")
        skills: List[SkillItem] = Field(default_factory=list, description="Extracted skills")

        def to_contract_dict(self) -> Dict[str, Any]:
            return self.model_dump()

else:
    @dataclass
    class SkillItem:
        skill_name: str
        category_code: SkillCategory
        evidence: str
        confidence: ConfidenceLevel = ConfidenceLevel.HIGH

        def to_dict(self) -> Dict[str, Any]:
            return {
                "skill_name": self.skill_name,
                "category_code": self.category_code.value if hasattr(self.category_code, "value") else str(self.category_code),
                "evidence": self.evidence,
                "confidence": self.confidence.value if hasattr(self.confidence, "value") else str(self.confidence),
            }

    @dataclass
    class JDExtractionOutput:
        source_type: str = "jd"
        source_file: str = "input_jd.txt"
        company: str = "Company"
        role: str = "Role"
        skills: List[SkillItem] = field(default_factory=list)

        def __post_init__(self):
            # Convert raw dicts in skills to SkillItem instances
            converted_skills = []
            for item in self.skills:
                if isinstance(item, dict):
                    cat = item.get("category_code", "OTHER")
                    try:
                        cat_enum = SkillCategory(cat)
                    except ValueError:
                        cat_enum = SkillCategory.OTHER
                    
                    conf = item.get("confidence", "high")
                    try:
                        conf_enum = ConfidenceLevel(conf)
                    except ValueError:
                        conf_enum = ConfidenceLevel.HIGH

                    converted_skills.append(
                        SkillItem(
                            skill_name=item.get("skill_name", "Skill"),
                            category_code=cat_enum,
                            evidence=item.get("evidence", ""),
                            confidence=conf_enum,
                        )
                    )
                else:
                    converted_skills.append(item)
            self.skills = converted_skills

        def to_contract_dict(self) -> Dict[str, Any]:
            return {
                "source_type": self.source_type,
                "source_file": self.source_file,
                "company": self.company,
                "role": self.role,
                "skills": [s.to_dict() if hasattr(s, "to_dict") else s for s in self.skills]
            }
