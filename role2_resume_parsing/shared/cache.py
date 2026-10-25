"""Response caching utility for LLM extractions.

Ensures deterministic test replay, zero redundant token consumption,
and offline execution capabilities.
"""

import hashlib
import json
import os
from typing import Any, Dict, Optional, Tuple


def compute_cache_key(full_prompt_text: str, prompt_version: str, model_id: str) -> str:
    """Compute a key from the full prompt text, prompt version, and model ID."""
    prompt_hash = hashlib.sha256(full_prompt_text.encode("utf-8")).hexdigest()
    content = f"{prompt_hash}|{prompt_version.strip()}|{model_id.strip()}"
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


class ResponseCache:
    """Manages disk-based caching across cache/ (gitignored) and recorded/ (tracked)."""

    def __init__(self, cache_dir: str = "cache", recorded_dir: str = "recorded"):
        self.cache_dir = cache_dir
        self.recorded_dir = recorded_dir
        os.makedirs(self.cache_dir, exist_ok=True)
        os.makedirs(self.recorded_dir, exist_ok=True)

    def get(self, key: str) -> Optional[Tuple[str, Dict[str, Any]]]:
        """Retrieve cached text and metadata by key if present.

        Returns (response_text, metadata) or None if not found.
        """
        # Check cache directory first
        cache_path = os.path.join(self.cache_dir, f"{key}.json")
        if os.path.exists(cache_path):
            with open(cache_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("response", ""), data.get("meta", {})

        # Check recorded directory (for replay mode)
        recorded_path = os.path.join(self.recorded_dir, f"{key}.json")
        if os.path.exists(recorded_path):
            with open(recorded_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("response", ""), data.get("meta", {})

        return None

    def put(
        self,
        key: str,
        response_text: str,
        meta: Optional[Dict[str, Any]] = None,
        as_recorded: bool = False,
    ) -> None:
        """Save response text and metadata to cache or recorded directory."""
        target_dir = self.recorded_dir if as_recorded else self.cache_dir
        os.makedirs(target_dir, exist_ok=True)
        file_path = os.path.join(target_dir, f"{key}.json")

        payload = {
            "key": key,
            "response": response_text,
            "meta": meta or {},
        }
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
