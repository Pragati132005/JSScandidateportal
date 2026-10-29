"""
JD Analytics LLM Extractor.
Supports Google Gemini, OpenAI, Anthropic, or an intelligent heuristic fallback.
"""

import os
import json
import re
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional, Dict, Any

# Auto-load .env if python-dotenv is available, or parse manually
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    env_file = Path(__file__).resolve().parent.parent / ".env"
    if env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

from .schema import JDExtractionOutput, SkillItem, SkillCategory, ConfidenceLevel
from .prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from .document_parser import parse_jd_file


class JDExtractor:
    """
    Analyzes Job Descriptions and extracts structured skills matching the RADIX contract.
    """

    
    def __init__(
        self,
        provider: Optional[str] = None,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None
    ):
        configured_provider = (
            provider or os.getenv("LLM_PROVIDER", "")
        ).strip().lower()

        self.provider = configured_provider or (
            "groq"
            if os.getenv("GROQ_API_KEY")
            else "gemini"
            if os.getenv("GEMINI_API_KEY")
            else "openai"
            if os.getenv("OPENAI_API_KEY")
            else "heuristic"
        )

        key_names = {
            "groq": "GROQ_API_KEY",
            "gemini": "GEMINI_API_KEY",
            "openai": "OPENAI_API_KEY",
            "anthropic": "ANTHROPIC_API_KEY",
        }

        configured_key = os.getenv(key_names.get(self.provider, ""), "")

        self.api_key = api_key or configured_key
        self.model_name = (
            model_name
            or os.getenv("GROQ_MODEL")
            if self.provider == "groq"
            else model_name
        )


        def extract_from_file(self, file_path: str | Path, company: Optional[str] = None, role: Optional[str] = None) -> JDExtractionOutput:
            """Parses a file (PDF/DOCX/TXT) and extracts skills."""
            path = Path(file_path)
            jd_text = parse_jd_file(path)
            return self.extract_from_text(jd_text, source_file=path.name, company=company, role=role)

    
    def extract_from_file(
        self,
        file_path: str | Path,
        company: Optional[str] = None,
        role: Optional[str] = None
    ) -> JDExtractionOutput:
        """Parse an uploaded JD file and extract its skills."""
        path = Path(file_path)

        # Extract text from PDF, DOCX, or TXT.
        jd_text = parse_jd_file(path)

        if not jd_text or not jd_text.strip():
            raise ValueError(
                f"No readable text found in job description: {path.name}"
            )

        # Reuse the existing Groq/LLM/heuristic extraction pipeline.
        return self.extract_from_text(
            jd_text=jd_text,
            source_file=path.name,
            company=company,
            role=role
        )

    def extract_from_text(
        self,
        jd_text: str,
        source_file: str = "input_jd.txt",
        company: Optional[str] = None,
        role: Optional[str] = None
    ) -> JDExtractionOutput:
        """Core extraction method using LLM or intelligent heuristic fallback."""
        user_prompt = USER_PROMPT_TEMPLATE.format(
            source_file=source_file,
            jd_text=jd_text
        )

        extracted_data = None
        
        # 0. Try Groq
        if self.provider == "groq":
          try:
            extracted_data = self._call_groq(user_prompt)
          except Exception as e:
            print(f"[Warning] Groq call failed: {e}. Using heuristic fallback...")


        # 1. Try Gemini
        if (self.provider in ["gemini", "auto"]) and (self.api_key or os.getenv("GEMINI_API_KEY")):
            try:
                extracted_data = self._call_gemini(user_prompt)
            except Exception as e:
                print(f"[Warning] Gemini call failed: {e}. Trying next option...")

        # 2. Try OpenAI
        if not extracted_data and (self.provider in ["openai", "auto"]) and (self.api_key or os.getenv("OPENAI_API_KEY")):
            try:
                extracted_data = self._call_openai(user_prompt)
            except Exception as e:
                print(f"[Warning] OpenAI call failed: {e}. Trying next option...")

        # 3. Fallback: Intelligent Heuristic Extraction if no LLM key or LLM failed
        if not extracted_data:
            print("[Info] Running in Heuristic Extraction mode (no active LLM API key detected).")
            extracted_data = self._heuristic_extract(jd_text, source_file, company, role)

        # Overwrite company or role if explicitly provided by caller
        if company:
            extracted_data["company"] = company
        if role:
            extracted_data["role"] = role
        if source_file:
            extracted_data["source_file"] = source_file

        return JDExtractionOutput(**extracted_data)

    def _call_gemini(self, prompt: str) -> Dict[str, Any]:
        """Calls Google Gemini API using the official google-genai SDK."""
        key = self.api_key or os.getenv("GEMINI_API_KEY")
        if not key or key == "your_key_here":
            raise ValueError("GEMINI_API_KEY is not set.")

        # 1. Use modern google.genai SDK
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=key)
            model_id = self.model_name or "gemini-3.5-flash-lite"
            response = client.models.generate_content(
                model=model_id,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"[Warning] google.genai call with {self.model_name or 'gemini-3.5-flash-lite'} failed: {e}. Trying alternative model...")

        # 2. Try gemini-3.8-flash as fallback model
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=key)
            response = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"[Warning] Secondary Gemini model failed: {e}. Trying REST endpoint...")

        # 3. Direct Gemini REST API fallback
        model_name = self.model_name or "gemini-3.5-flash-lite"
        clean_model = model_name.replace("models/", "")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{clean_model}:generateContent?key={key}"
        payload = {
            "system_instruction": {
                "parts": [{"text": SYSTEM_PROMPT}]
            },
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "response_mime_type": "application/json"
            }
        }
        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=req_data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
    
    def _call_groq(self, prompt: str) -> Dict[str, Any]:
        """Calls Groq using its OpenAI-compatible API."""

        from openai import OpenAI

        key = self.api_key or os.getenv("GROQ_API_KEY")

        if not key:
            raise ValueError("GROQ_API_KEY is not set.")

        client = OpenAI(
            api_key=key,
            base_url="https://api.groq.com/openai/v1",
        )

        model_id = self.model_name or "llama-3.3-70b-versatile"

        response = client.chat.completions.create(
            model=model_id,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError("Groq returned an empty response.")

        result = json.loads(content)

        if not isinstance(result, dict):
            raise ValueError("Groq returned an invalid JSON object.")

        return result

    def _call_openai(self, prompt: str) -> Dict[str, Any]:
        """Calls OpenAI API."""
        from openai import OpenAI
        client = OpenAI(api_key=self.api_key or os.getenv("OPENAI_API_KEY"))
        model_id = self.model_name or "gpt-4o-mini"
        response = client.chat.completions.create(
            model=model_id,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)

    def _heuristic_extract(
        self,
        jd_text: str,
        source_file: str,
        company: Optional[str] = None,
        role: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        High-precision rule-based extractor to guarantee 100% functionality
        offline or during development prior to plugging in LLM API keys.
        """
        # Guess company & role if not provided
        detected_company = company or "Company"
        detected_role = role or "Software Engineer"

        lower_text = jd_text.lower()
        if "google" in lower_text:
            detected_company = "Google LLC"
        elif "microsoft" in lower_text:
            detected_company = "Microsoft Corporation"
        elif "oracle" in lower_text:
            detected_company = "Oracle Financial Services Software"

        if "data scientist" in lower_text:
            detected_role = "Data Scientist"
        elif "data analyst" in lower_text:
            detected_role = "Data Analyst"
        elif "application support" in lower_text:
            detected_role = "Application Support Analyst"
        elif "associate software engineer" in lower_text:
            detected_role = "Associate Software Engineer"
        elif "software engineer" in lower_text or "swe" in lower_text:
            detected_role = "Software Engineer (SWE)"

        # Dictionary of skill indicators mapped to RADIX categories
        skill_catalog = [
            # DSA
            ("Data Structures & Algorithms", "DSA", ["data structures", "algorithms", "problem solving", "algorithmic", "complexity"]),
            ("Graph & Tree Algorithms", "DSA", ["trees", "graphs", "bfs", "dfs", "dynamic programming"]),
            # COD
            ("Python", "COD", ["python", "django", "flask", "fastapi"]),
            ("Java", "COD", ["java", "spring boot", "jvm"]),
            ("C++", "COD", ["c++", "modern c++", "stl"]),
            ("JavaScript / TypeScript", "COD", ["javascript", "typescript", "node.js", "react"]),
            ("Go (Golang)", "COD", ["golang", "go programming"]),
            # OOD
            ("Object-Oriented Design", "OOD", ["oop", "object-oriented", "design patterns", "solid principles", "modularity"]),
            # APTI
            ("Analytical Problem Solving", "APTI", ["analytical thinking", "quantitative analysis", "critical thinking", "root cause analysis"]),
            # COMM
            ("Technical Communication", "COMM", ["communication skills", "cross-functional", "stakeholders", "team collaboration", "written communication"]),
            # AI
            ("Machine Learning & Deep Learning", "AI", ["machine learning", "deep learning", "neural networks", "scikit-learn", "tensorflow", "pytorch"]),
            ("Data Science & Modeling", "AI", ["statistical analysis", "predictive modeling", "pandas", "numpy", "data science"]),
            ("Generative AI & LLMs", "AI", ["llm", "large language models", "prompt engineering", "langchain", "transformers"]),
            # CLOUD
            ("Cloud Platforms (GCP / AWS / Azure)", "CLOUD", ["gcp", "aws", "azure", "cloud computing", "google cloud"]),
            ("Containerization & Orchestration (Docker / K8s)", "CLOUD", ["docker", "kubernetes", "k8s", "containers"]),
            # SQL
            ("SQL & Relational Databases", "SQL", ["sql", "postgresql", "mysql", "oracle db", "relational database", "queries"]),
            ("NoSQL & Data Stores", "SQL", ["nosql", "mongodb", "cassandra", "redis", "dynamodb"]),
            # SWE
            ("Version Control (Git)", "SWE", ["git", "github", "gitlab", "version control"]),
            ("CI/CD & DevOps", "SWE", ["ci/cd", "continuous integration", "jenkins", "github actions", "devops"]),
            ("Testing & Code Quality", "SWE", ["unit testing", "test-driven", "qa", "code review", "integration testing"]),
            # SYSD
            ("Distributed Systems", "SYSD", ["distributed systems", "microservices", "high availability", "scalability", "load balancing"]),
            ("API Design (REST/gRPC)", "SYSD", ["restful", "rest api", "grpc", "api design", "web services"]),
            # NETW
            ("Networking Fundamentals", "NETW", ["tcp/ip", "dns", "http/https", "protocols", "networking"]),
            # OS
            ("Linux / Operating Systems", "OS", ["linux", "unix", "posix", "shell scripting", "bash"]),
            ("Concurrency & Multithreading", "OS", ["concurrency", "multithreading", "parallel processing", "memory management"]),
            # OTHER
            ("Financial Services & Compliance", "OTHER", ["financial services", "banking", "fintech", "compliance", "regulatory"])
        ]

        found_skills = []
        for name, category, keywords in skill_catalog:
            for kw in keywords:
                # Find matching quote
                pattern = re.compile(rf"([^.\n]*?{re.escape(kw)}[^.\n]*)", re.IGNORECASE)
                match = pattern.search(jd_text)
                if match:
                    sentence = match.group(0).strip()
                    if len(sentence) > 150:
                        sentence = sentence[:147] + "..."
                    evidence_text = sentence if len(sentence) > 10 else f"Required knowledge in {kw} mentioned in requirements."
                    found_skills.append({
                        "skill_name": name,
                        "category_code": category,
                        "evidence": evidence_text,
                        "confidence": "high" if kw in ["data structures", "python", "sql", "distributed systems", "machine learning"] else "medium"
                    })
                    break  # Matched one keyword for this skill

        if not found_skills:
            # Add general default if text was too sparse
            found_skills.append({
                "skill_name": "Software Engineering Fundamentals",
                "category_code": "SWE",
                "evidence": "General engineering requirement inferred from job posting.",
                "confidence": "medium"
            })

        return {
            "source_type": "jd",
            "source_file": source_file,
            "company": detected_company,
            "role": detected_role,
            "skills": found_skills
        }
