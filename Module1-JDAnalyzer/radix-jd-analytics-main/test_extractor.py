"""
Unit and Integration Test Suite for Role 1: JD Analytics.
Validates extraction against Hackathon sample JDs and verifies contract conformance.
"""

import sys
import json
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from src.extractor import JDExtractor
from src.schema import JDExtractionOutput, SkillCategory


def test_extraction_on_sample_jds():
    sample_dir = Path(__file__).parent / "data" / "sample_jds"
    sample_files = list(sample_dir.glob("*.txt"))

    assert len(sample_files) >= 2, f"Expected at least 2 sample JDs, found {len(sample_files)}"

    extractor = JDExtractor()
    print(f"\n==========================================")
    print(f"Running JD Analytics Test against {len(sample_files)} sample JDs")
    print(f"Active Provider: {extractor.provider}")
    print(f"==========================================\n")

    for file_path in sample_files:
        print(f"--> Testing extraction on: {file_path.name}")
        output: JDExtractionOutput = extractor.extract_from_file(file_path)

        # Assert contract requirements
        assert output.source_type == "jd", f"source_type must be 'jd', got {output.source_type}"
        assert output.source_file == file_path.name, f"source_file mismatch"
        assert output.company and len(output.company) > 0, "Company name missing"
        assert output.role and len(output.role) > 0, "Role name missing"
        assert len(output.skills) > 0, f"No skills extracted from {file_path.name}"

        # Assert every skill has a valid RADIX category code
        for skill in output.skills:
            assert isinstance(skill.category_code, SkillCategory), f"Invalid category code {skill.category_code}"
            assert skill.skill_name and len(skill.skill_name) > 0
            assert skill.evidence and len(skill.evidence) > 0
            assert skill.confidence in ["high", "medium", "low"]

        categories_found = set(s.category_code.value for s in output.skills)
        print(f"    [OK] Extracted {len(output.skills)} skills across {len(categories_found)} categories.")
        print(f"    Company: {output.company} | Role: {output.role}")
        print(f"    Sample Skill: {output.skills[0].skill_name} [{output.skills[0].category_code}]")
        print()

    print("ALL TESTS PASSED! Conforms 100% to RADIX Data Contract.")


if __name__ == "__main__":
    test_extraction_on_sample_jds()
