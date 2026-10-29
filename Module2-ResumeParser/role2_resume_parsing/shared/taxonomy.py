"""Shared taxonomy normalisation and canonical lookup.

Deterministic categorization against the 12 RADIX framework categories
(COD, DSA, OOD, APTI, COMM, AI, CLOUD, SQL, SWE, SYSD, NETW, OS, OTHER).
"""

import json
import os
import re
from typing import Dict, List, Optional, Tuple
from rapidfuzz import fuzz

TAXONOMY_PATH = os.path.join(os.path.dirname(__file__), "taxonomy", "taxonomy_v1.json")


class SkillTaxonomy:
    """Taxonomy provider loaded once, thread-safe, supporting exact and fuzzy matching."""

    _instance: Optional["SkillTaxonomy"] = None

    def __init__(self, json_path: Optional[str] = None):
        self.json_path = json_path or TAXONOMY_PATH
        self._load()

    @classmethod
    def get_instance(cls, json_path: Optional[str] = None) -> "SkillTaxonomy":
        """Get or initialize singleton taxonomy instance."""
        if cls._instance is None:
            cls._instance = SkillTaxonomy(json_path)
        return cls._instance

    def _load(self):
        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        self.version = data.get("taxonomy_version", "v1.0")
        self.categories = set(data.get("categories", []))
        self.skills = data.get("skills", [])

        # Build lookup tables
        # normalized_alias -> (canonical, category_code, ambiguous, note)
        self.lookup: Dict[str, Tuple[str, str, bool, str]] = {}
        self.exact_only: Dict[str, Tuple[str, str, bool, str]] = {}
        self.all_candidates: List[str] = []

        for item in self.skills:
            canonical = item["canonical"]
            cat_code = item["category_code"]
            ambiguous = item.get("ambiguous", False)
            note = item.get("note", "")
            exact_only = item.get("free_text_match", True) is False

            if exact_only:
                self.exact_only[canonical] = (canonical, cat_code, ambiguous, note)
                continue

            # Index canonical
            norm_canon = self._normalize_key(canonical)
            self.lookup[norm_canon] = (canonical, cat_code, ambiguous, note)
            self.all_candidates.append(canonical)

            # Index aliases
            for alias in item.get("aliases", []):
                norm_alias = self._normalize_key(alias)
                self.lookup[norm_alias] = (canonical, cat_code, ambiguous, note)
                self.all_candidates.append(alias)

    @staticmethod
    def _normalize_key(name: str) -> str:
        """Strip non-alphanumeric (keep + and #) and lowercase."""
        s = name.strip().lower()
        s = re.sub(r"[^\w\+#]", " ", s)
        return " ".join(s.split())

    def normalise(
        self, skill_name: str, fuzzy_threshold: float = 85.0
    ) -> Tuple[str, str, bool]:
        """Normalize a skill name into canonical name, category_code, and ambiguity flag.

        Args:
            skill_name: The extracted skill string.
            fuzzy_threshold: Minimum RapidFuzz match ratio (default 85.0).

        Returns:
            Tuple of (canonical_name, category_code, is_ambiguous).
        """
        if not skill_name or not skill_name.strip():
            return ("", "OTHER", False)

        raw = skill_name.strip()
        if raw in self.exact_only:
            canonical, cat_code, ambiguous, _ = self.exact_only[raw]
            return (canonical, cat_code, ambiguous)
        norm = self._normalize_key(raw)

        # 1. Exact match in lookup
        if norm in self.lookup:
            canonical, cat_code, ambiguous, _ = self.lookup[norm]
            return (canonical, cat_code, ambiguous)

        # 2. Fuzzy match against all known aliases and canonicals
        best_candidate = None
        best_score = 0.0

        for candidate in self.all_candidates:
            score = fuzz.token_sort_ratio(raw.lower(), candidate.lower())
            if score > best_score:
                best_score = score
                best_candidate = candidate

        if best_score >= fuzzy_threshold and best_candidate:
            norm_cand = self._normalize_key(best_candidate)
            canonical, cat_code, ambiguous, _ = self.lookup[norm_cand]
            return (canonical, cat_code, ambiguous)

        # 3. Fallback: unknown skill preserves raw name, assigned to OTHER
        return (raw, "OTHER", False)


def normalise(skill_name: str, fuzzy_threshold: float = 85.0) -> Tuple[str, str, bool]:
    """Module-level convenience wrapper for SkillTaxonomy normalisation."""
    tax = SkillTaxonomy.get_instance()
    return tax.normalise(skill_name, fuzzy_threshold=fuzzy_threshold)
