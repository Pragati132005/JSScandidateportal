"""Regression tests for model-independent recorded replay."""

import os

import pytest

from contract.schema import ResumeParseResult
from resume_parser.pipeline import parse_resume
from shared.cache import ResponseCache
from shared.llm_client import LLMClient


SAMPLE_RESUME = os.path.join("data", "resumes", "PDF", "Rohan Verma.pdf")


@pytest.mark.parametrize(
    "model_values",
    [
        {},
        {
            "GEMINI_MODEL": "retired-gemini-model",
            "GROQ_MODEL": "retired-groq-model",
            "OPENROUTER_MODEL": "retired-openrouter-model",
        },
    ],
)
def test_replay_uses_p4_fixture_without_model_ids(monkeypatch, model_values):
    for name in ("GEMINI_MODEL", "GROQ_MODEL", "OPENROUTER_MODEL"):
        monkeypatch.delenv(name, raising=False)
    for name, value in model_values.items():
        monkeypatch.setenv(name, value)

    result = parse_resume(SAMPLE_RESUME, use_llm=True, client=LLMClient(mode="replay"))

    assert isinstance(result, ResumeParseResult)
    assert result.meta.model_used == "gemini-3.1-flash-lite"
    assert result.meta.prompt_version == "p4"
    assert result.meta.from_cache is True


def test_replay_miss_warns_and_uses_rule_based_fallback(tmp_path):
    client = LLMClient(mode="replay")
    client.cache = ResponseCache(
        cache_dir=str(tmp_path / "cache"),
        recorded_dir=str(tmp_path / "recorded"),
    )

    result = parse_resume(SAMPLE_RESUME, use_llm=True, client=client)

    assert result.meta.model_used == "rule-based-fallback"
    assert "replay: no recorded answer, rule-based fallback used" in result.meta.parse_warnings
