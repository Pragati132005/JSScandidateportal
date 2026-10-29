"""Evidence gap analysis and category rollup summary (M13 - Tier 2).

Computes rollup metrics across all 12 RADIX categories to feed Role 4 (Talent Check)
without encroaching on Role 4's scoring definitions.
"""

from typing import Dict, List, Tuple
from contract.schema import CategorySummaryItem, Skill

RADIX_12_CATEGORIES = [
    "COD", "DSA", "OOD", "APTI", "COMM", "AI",
    "CLOUD", "SQL", "SWE", "SYSD", "NETW", "OS"
]

CONFIDENCE_RANK = {"high": 3, "medium": 2, "low": 1}


def generate_category_summary(
    skills: List[Skill],
) -> Tuple[Dict[str, CategorySummaryItem], List[str], List[str]]:
    """Compute category summaries, unevidenced categories, and suggested manual additions.

    Args:
        skills: Processed, grounded list of Skill models.

    Returns:
        Tuple of (category_summary_dict, categories_without_evidence, suggested_manual_additions).
    """
    summary: Dict[str, CategorySummaryItem] = {}
    categories_without_evidence: List[str] = []
    suggested_manual_additions: List[str] = []

    for cat in RADIX_12_CATEGORIES:
        matching_skills = [s for s in skills if s.category_code == cat]

        if matching_skills:
            # Sort by confidence rank descending, then longest evidence
            sorted_skills = sorted(
                matching_skills,
                key=lambda s: (CONFIDENCE_RANK.get(s.confidence, 1), len(s.evidence)),
                reverse=True,
            )
            top_skill = sorted_skills[0]

            summary[cat] = CategorySummaryItem(
                category_code=cat,  # type: ignore
                skill_count=len(matching_skills),
                strongest_confidence=top_skill.confidence,
                strongest_evidence=top_skill.evidence,
                has_evidence=True,
            )
        else:
            summary[cat] = CategorySummaryItem(
                category_code=cat,  # type: ignore
                skill_count=0,
                strongest_confidence=None,
                strongest_evidence=None,
                has_evidence=False,
            )
            categories_without_evidence.append(cat)
            suggested_manual_additions.append(cat)

    return summary, categories_without_evidence, suggested_manual_additions
