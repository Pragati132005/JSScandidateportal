"""Tests for shared/llm_client.py and shared/cache.py running entirely offline."""

import json
import pytest
from shared.cache import compute_cache_key, compute_replay_key, ResponseCache
from shared.llm_client import LLMClient, clean_json_markdown, LLMResponse, content_to_text


def test_content_to_text_string_content():
    assert content_to_text("  plain response  ") == "  plain response  "


def test_content_to_text_text_blocks():
    content = [
        {"type": "text", "text": "first block"},
        {"type": "text", "text": "second block"},
    ]
    assert content_to_text(content) == "first block\nsecond block"


def test_content_to_text_ignores_non_text_blocks():
    content = [
        {"type": "image_url", "image_url": {"url": "https://example.test/image"}},
        {"type": "text", "text": "only text kept"},
        {"type": "tool_use", "name": "ignored"},
    ]
    assert content_to_text(content) == "only text kept"


def test_cache_key_deterministic():
    """Verify compute_cache_key is deterministic."""
    k1 = compute_cache_key("test resume text", "p1", "gemini-2.5-flash")
    k2 = compute_cache_key("test resume text", "p1", "gemini-2.5-flash")
    k3 = compute_cache_key("different text", "p1", "gemini-2.5-flash")
    assert k1 == k2
    assert k1 != k3


def test_cache_key_changes_when_system_prompt_changes():
    first = compute_cache_key("system one\nuser", "p4", "gemini-2.5-flash")
    second = compute_cache_key("system two\nuser", "p4", "gemini-2.5-flash")
    assert first != second


def test_replay_key_ignores_model_id():
    first = compute_replay_key("cleaned resume", "p4")
    second = compute_replay_key("cleaned resume", "p4")
    assert first == second


def test_clean_json_markdown():
    """Verify markdown code fences are cleanly removed."""
    raw = "```json\n{\"test\": 123}\n```"
    cleaned = clean_json_markdown(raw)
    assert cleaned == '{"test": 123}'

    plain = '{"test": 123}'
    assert clean_json_markdown(plain) == '{"test": 123}'


def test_mock_mode():
    """Verify mock mode returns deterministic canned JSON without network calls."""
    client = LLMClient(mode="mock")
    res = client.generate("system prompt", "user prompt")
    assert isinstance(res, LLMResponse)
    assert res.provider_used == "mock"
    assert res.parsed_json is not None
    assert res.parsed_json["name"] == "Candidate Mock"
    assert len(res.parsed_json["skills"]) > 0


def test_cache_roundtrip(tmp_path):
    """Verify saving and retrieving from ResponseCache."""
    cache = ResponseCache(cache_dir=str(tmp_path / "c"), recorded_dir=str(tmp_path / "r"))
    key = "sample_key_123"
    content = '{"status": "ok"}'
    cache.put(key, content, meta={"model": "test-model"})

    retrieved = cache.get(key)
    assert retrieved is not None
    resp, meta = retrieved
    assert resp == content
    assert meta["model"] == "test-model"


def test_client_cache_hit(tmp_path, monkeypatch):
    """Verify LLMClient uses cached response when available."""
    client = LLMClient(mode="live")
    # Point cache to temp directory
    client.cache = ResponseCache(cache_dir=str(tmp_path / "c"), recorded_dir=str(tmp_path / "r"))

    system_prompt = "system"
    user_prompt = "user test prompt"
    primary_model = client.models.get("gemini", "gemini-2.5-flash")
    key = compute_cache_key(f"{system_prompt}\n{user_prompt}", "p1", primary_model)

    cached_json = {"name": "Cached Candidate", "skills": []}
    client.cache.put(key, json.dumps(cached_json), meta={"model": primary_model})

    res = client.generate(system_prompt, user_prompt, prompt_version="p1")
    assert res.from_cache is True
    assert res.parsed_json["name"] == "Cached Candidate"


def test_failover_logic(monkeypatch, tmp_path):
    """Verify client fails over to next provider if first raises an error."""
    client = LLMClient(provider_order=["gemini", "groq"], mode="live")
    client.cache = ResponseCache(cache_dir=str(tmp_path / "c"), recorded_dir=str(tmp_path / "r"))

    # Mock call_provider to fail on gemini and succeed on groq
    call_log = []

    def mock_call(provider, model_id, system_prompt, user_prompt):
        call_log.append(provider)
        if provider == "gemini":
            raise RuntimeError("Gemini quota rate-limit error (429)")
        elif provider == "groq":
            return json.dumps({"name": "Groq Candidate", "skills": []})
        raise ValueError(f"Unexpected provider {provider}")

    monkeypatch.setattr(client, "_call_provider", mock_call)

    res = client.generate("sys", "usr")
    assert call_log == ["gemini", "groq"]
    assert res.provider_used == "groq"
    assert res.parsed_json["name"] == "Groq Candidate"
    assert len(res.warnings) > 0
    assert "Gemini quota" in res.warnings[0]
    assert res.warnings[0].startswith("gemini failed:")
    assert res.warnings[0].endswith("; used groq")
