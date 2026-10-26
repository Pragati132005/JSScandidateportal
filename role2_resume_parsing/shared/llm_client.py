"""Unified LLM client with multi-provider failover, caching, and retry logic.

Providers: Gemini -> Groq -> OpenRouter -> Rule-based fallback.
Supports modes:
- live: calls API endpoints with rate-limit retries and provider failover.
- replay: uses pre-recorded responses from recorded/ for offline execution.
- mock: deterministic canned response for test runs without credentials.
"""

import json
import os
import re
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv

from shared.cache import ResponseCache, compute_cache_key

# Load environment variables
load_dotenv()


@dataclass
class LLMResponse:
    """Standardized response from LLM call."""
    content: str
    parsed_json: Optional[Dict[str, Any]] = None
    model_used: str = "mock"
    provider_used: str = "mock"
    from_cache: bool = False
    latency_ms: int = 0
    warnings: List[str] = field(default_factory=list)


class ReplayMissError(RuntimeError):
    """Raised when replay mode has no recorded answer for the requested input."""


def content_to_text(content: Any) -> str:
    """Convert string or provider content blocks into plain text."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_blocks: List[str] = []
        for block in content:
            if isinstance(block, dict):
                block_type = block.get("type")
                block_text = block.get("text")
            else:
                block_type = getattr(block, "type", None)
                block_text = getattr(block, "text", None)
            if block_type == "text" and isinstance(block_text, str):
                text_blocks.append(block_text)
        return "\n".join(text_blocks)
    return str(content)


def _short_failure_reason(error: Any) -> str:
    reason = str(error).strip().replace("\n", " ")
    return reason[:160] if reason else "unknown error"


def clean_json_markdown(text: Any) -> str:
    """Strip markdown code blocks or wrapper markers from raw LLM output."""
    stripped = content_to_text(text).strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", stripped)
    if match:
        return match.group(1).strip()
    return stripped


class LLMClient:
    """Multi-provider LLM client with automatic failover, retries, and caching."""

    def __init__(
        self,
        provider_order: Optional[List[str]] = None,
        timeout_s: Optional[int] = None,
        mode: Optional[str] = None,
    ):
        self.mode = (mode or os.getenv("LLM_MODE", "replay")).lower()
        self.timeout_s = timeout_s or int(os.getenv("LLM_TIMEOUT_S", "30"))

        raw_order = provider_order or os.getenv(
            "LLM_PROVIDER_ORDER", "gemini,groq,openrouter"
        ).split(",")
        self.provider_order = [p.strip().lower() for p in raw_order if p.strip()]

        self.models = {
            "gemini": os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            "groq": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            "openrouter": os.getenv(
                "OPENROUTER_MODEL", "google/gemini-2.0-flash-001"
            ),
        }
        self.cache = ResponseCache()

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        prompt_version: str = "p4",
        cache_key_override: Optional[str] = None,
        replay_key_override: Optional[str] = None,
    ) -> LLMResponse:
        """Execute LLM generation with caching, retry, and failover logic."""
        start_time = time.time()
        combined_text = f"{system_prompt}\n{user_prompt}"

        # 1. Mock Mode
        if self.mode == "mock":
            return self._generate_mock(combined_text)

        # 2. Check Cache / Recorded Responses
        # Use first provider's model ID for standard cache key computation
        primary_model = self.models.get(self.provider_order[0], "gemini-2.5-flash")
        cache_key = cache_key_override or compute_cache_key(
            combined_text, prompt_version, primary_model
        )
        lookup_key = replay_key_override if self.mode == "replay" and replay_key_override else cache_key

        cached_entry = self.cache.get(lookup_key)
        if cached_entry:
            raw_text, meta = cached_entry
            raw_text = content_to_text(raw_text)
            parsed = self._try_parse_json(raw_text)
            return LLMResponse(
                content=raw_text,
                parsed_json=parsed,
                model_used=meta.get("model", primary_model),
                provider_used=meta.get("provider", "cache"),
                from_cache=True,
                latency_ms=int((time.time() - start_time) * 1000),
            )

        # In replay mode, if not found in cache/recorded, raise error or fallback to mock
        if self.mode == "replay":
            raise ReplayMissError(
                f"Replay mode requested but no cached/recorded response found for key: {lookup_key}"
            )

        # 3. Live Mode: Iterate Provider Chain
        provider_failures: List[tuple[str, str]] = []
        for provider in self.provider_order:
            model_id = self.models.get(provider, "default")
            try:
                raw_response = content_to_text(self._call_provider(
                    provider=provider,
                    model_id=model_id,
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                ))
                parsed = self._try_parse_json(raw_response)

                # If JSON parsing failed, attempt one repair call
                if parsed is None:
                    repair_prompt = (
                        f"Your previous output was not valid JSON. Return ONLY the valid JSON object:\n\n{raw_response}"
                    )
                    repaired_raw = content_to_text(self._call_provider(
                        provider=provider,
                        model_id=model_id,
                        system_prompt=system_prompt,
                        user_prompt=repair_prompt,
                    ))
                    parsed = self._try_parse_json(repaired_raw)
                    if parsed is not None:
                        raw_response = repaired_raw
                    else:
                        provider_failures.append((provider, "malformed JSON after repair"))
                        continue

                # Save successful response to cache
                raw_response = content_to_text(raw_response)
                self.cache.put(
                    key=cache_key,
                    response_text=raw_response,
                    meta={"provider": provider, "model": model_id},
                )

                return LLMResponse(
                    content=raw_response,
                    parsed_json=parsed,
                    model_used=model_id,
                    provider_used=provider,
                    from_cache=False,
                    latency_ms=int((time.time() - start_time) * 1000),
                    warnings=[
                        f"{failed_provider} failed: {reason}; used {provider}"
                        for failed_provider, reason in provider_failures
                    ],
                )

            except Exception as e:
                provider_failures.append((provider, _short_failure_reason(e)))
                continue

        # If all providers failed
        raise RuntimeError(
            "All LLM providers in chain failed: "
            + "; ".join(f"{provider} failed: {reason}" for provider, reason in provider_failures)
        )

    def _call_provider(
        self,
        provider: str,
        model_id: str,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """Call a specific LLM provider."""
        from langchain_core.messages import HumanMessage, SystemMessage

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ]

        if provider == "gemini":
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_API_KEY not configured in environment.")
            from langchain_google_genai import ChatGoogleGenerativeAI

            llm = ChatGoogleGenerativeAI(
                model=model_id,
                google_api_key=api_key,
                temperature=0.0,
                timeout=self.timeout_s,
            )
            res = llm.invoke(messages)
            return content_to_text(res.content)

        elif provider == "groq":
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY not configured in environment.")
            from langchain_groq import ChatGroq

            llm = ChatGroq(
                model_name=model_id,
                groq_api_key=api_key,
                temperature=0.0,
                timeout=self.timeout_s,
            )
            res = llm.invoke(messages)
            return content_to_text(res.content)

        elif provider == "openrouter":
            api_key = os.getenv("OPENROUTER_API_KEY")
            if not api_key:
                raise ValueError("OPENROUTER_API_KEY not configured in environment.")
            from langchain_openai import ChatOpenAI

            llm = ChatOpenAI(
                model=model_id,
                openai_api_key=api_key,
                openai_api_base="https://openrouter.ai/api/v1",
                temperature=0.0,
                timeout=self.timeout_s,
            )
            res = llm.invoke(messages)
            return content_to_text(res.content)

        else:
            raise ValueError(f"Unknown provider: {provider}")

    def _try_parse_json(self, text: Any) -> Optional[Dict[str, Any]]:
        """Attempt to parse text as JSON after stripping markdown blocks."""
        cleaned = clean_json_markdown(content_to_text(text))
        try:
            res = json.loads(cleaned)
            return res if isinstance(res, dict) else None
        except Exception:
            return None

    def _generate_mock(self, prompt: str) -> LLMResponse:
        """Generate deterministic canned extraction for testing."""
        mock_data = {
            "name": "Candidate Mock",
            "email": None,
            "phone": None,
            "links": [],
            "education": [
                {
                    "degree": "B.Tech",
                    "field": "Computer Science",
                    "institution": None,
                    "graduation_year": 2026,
                    "grade": "9.0 / 10",
                    "grade_scale": "CGPA",
                }
            ],
            "skills": [
                {
                    "skill_name": "Python",
                    "category_code": "COD",
                    "evidence": "Python programming",
                    "confidence": "high",
                    "source_section": "technical_skills",
                },
                {
                    "skill_name": "Data Structures & Algorithms",
                    "category_code": "DSA",
                    "evidence": "Data Structures & Algorithms",
                    "confidence": "high",
                    "source_section": "technical_skills",
                },
            ],
            "projects": [
                {
                    "title": "Mock Project",
                    "description": "Built mock service",
                    "technologies": ["Python"],
                }
            ],
            "experience": [],
            "hackathons": [],
            "internships": [],
            "certifications": [],
            "achievements": [],
            "preferred_roles": ["Software Engineer"],
        }
        return LLMResponse(
            content=json.dumps(mock_data),
            parsed_json=mock_data,
            model_used="mock-model",
            provider_used="mock",
            from_cache=False,
            latency_ms=1,
        )
