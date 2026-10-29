"""Ping configured LLM providers and print status and latency."""

import os
import sys
import time
from dotenv import load_dotenv

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from shared.llm_client import content_to_text

load_dotenv()


def ping_providers():
    providers = os.getenv("LLM_PROVIDER_ORDER", "gemini,groq,openrouter").split(",")
    providers = [p.strip().lower() for p in providers if p.strip()]

    print(f"Testing configured providers in order: {providers}\n")

    for provider in providers:
        print(f"--- Pinging: {provider.upper()} ---")
        start = time.time()
        try:
            if provider == "gemini":
                api_key = os.getenv("GOOGLE_API_KEY")
                if not api_key:
                    print("  Status: SKIPPED (No GOOGLE_API_KEY found in environment)")
                    continue
                from langchain_google_genai import ChatGoogleGenerativeAI
                model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
                llm = ChatGoogleGenerativeAI(model=model, google_api_key=api_key, timeout=15)
                res = llm.invoke("Respond with the word 'PONG'.")
                latency = int((time.time() - start) * 1000)
                response_text = content_to_text(res.content)
                print(f"  Status: SUCCESS | Model: {model} | Latency: {latency}ms | Response: {response_text.strip()[:20]}")

            elif provider == "groq":
                api_key = os.getenv("GROQ_API_KEY")
                if not api_key:
                    print("  Status: SKIPPED (No GROQ_API_KEY found in environment)")
                    continue
                from langchain_groq import ChatGroq
                model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
                llm = ChatGroq(model_name=model, groq_api_key=api_key, timeout=15)
                res = llm.invoke("Respond with the word 'PONG'.")
                latency = int((time.time() - start) * 1000)
                response_text = content_to_text(res.content)
                print(f"  Status: SUCCESS | Model: {model} | Latency: {latency}ms | Response: {response_text.strip()[:20]}")

            elif provider == "openrouter":
                api_key = os.getenv("OPENROUTER_API_KEY")
                if not api_key:
                    print("  Status: SKIPPED (No OPENROUTER_API_KEY found in environment)")
                    continue
                from langchain_openai import ChatOpenAI
                model = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
                llm = ChatOpenAI(model=model, openai_api_key=api_key, openai_api_base="https://openrouter.ai/api/v1", timeout=15)
                res = llm.invoke("Respond with the word 'PONG'.")
                latency = int((time.time() - start) * 1000)
                response_text = content_to_text(res.content)
                print(f"  Status: SUCCESS | Model: {model} | Latency: {latency}ms | Response: {response_text.strip()[:20]}")

        except Exception as e:
            latency = int((time.time() - start) * 1000)
            print(f"  Status: FAILED | Latency: {latency}ms | Error: {str(e)}")


if __name__ == "__main__":
    ping_providers()
