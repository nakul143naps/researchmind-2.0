from __future__ import annotations

import os
import re
from typing import Literal

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, SecretStr

app = FastAPI(title="ResearchMind API", version="0.1.0")
allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "RESEARCHMIND_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if allowed_origins else ["*"],
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    topic: str = Field(min_length=3, max_length=500)
    openrouter_api_key: SecretStr = Field(min_length=10)
    tavily_api_key: SecretStr = Field(min_length=10)
    model: str = "qwen/qwen3.8-27b:free"
    temperature: float = Field(default=0.2, ge=0, le=1)
    max_sources: int = Field(default=5, ge=1, le=10)
    depth: Literal["quick", "balanced", "deep"] = "balanced"


class Source(BaseModel):
    title: str
    url: str
    snippet: str
    score: float | None = None


class ResearchResponse(BaseModel):
    topic: str
    report: str
    critique: str
    sources: list[Source]


class ProviderError(Exception):
    def __init__(self, provider: str, message: str):
        self.provider = provider
        self.message = message
        super().__init__(message)


def _secret(value: SecretStr) -> str:
    return value.get_secret_value()


async def _search(request: ResearchRequest) -> list[Source]:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.tavily.com/search",
            json={
                "api_key": _secret(request.tavily_api_key),
                "query": request.topic,
                "search_depth": "advanced" if request.depth == "deep" else "basic",
                "max_results": request.max_sources,
                "include_answer": False,
            },
        )
    if response.is_error:
        if response.status_code in (401, 403):
            raise ProviderError("Tavily", "The Tavily key was rejected. Check that it is active and copied completely.")
        raise ProviderError("Tavily", _provider_message(response, "Tavily search failed"))
    return [
        Source(
            title=item.get("title", "Untitled source"),
            url=item.get("url", ""),
            snippet=item.get("content", "")[:600],
            score=item.get("score"),
        )
        for item in response.json().get("results", [])
    ]


async def _complete(request: ResearchRequest, prompt: str) -> str:
    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": "Bearer " + _secret(request.openrouter_api_key),
                "Content-Type": "application/json",
                "HTTP-Referer": os.getenv("RESEARCHMIND_APP_URL", "http://localhost:5173"),
                "X-Title": "ResearchMind",
            },
            json={
                "model": request.model,
                "temperature": request.temperature,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are ResearchMind, a careful research assistant for students. Cite claims using [n] source markers and never invent sources.",
                    },
                    {"role": "user", "content": prompt},
                ],
            },
        )
    if response.is_error:
        if response.status_code in (401, 403):
            raise ProviderError("OpenRouter", "The OpenRouter key was rejected or has no access to this model.")
        raise ProviderError("OpenRouter", _provider_message(response, "OpenRouter generation failed"))
    data = response.json()
    if isinstance(data.get("error"), dict):
        error = data["error"]
        message = str(error.get("message") or "The selected model provider failed.")
        code = error.get("code")
        suffix = f" (code {code})" if code else ""
        raise ProviderError(
            "OpenRouter",
            f"{message[:240]}{suffix} Model: {request.model}. Try OpenRouter Free Router or another model.",
        )
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise ProviderError("OpenRouter", "OpenRouter returned an unexpected response. Try another model.") from exc


def _provider_message(response: httpx.Response, fallback: str) -> str:
    try:
        payload = response.json()
        error = payload.get("error", {})
        message = error.get("message") if isinstance(error, dict) else None
        if message:
            return f"{fallback}: {str(message)[:240]}"
    except ValueError:
        pass
    return f"{fallback} (HTTP {response.status_code})."


def _sources_text(sources: list[Source]) -> str:
    return "\n".join(
        f"[{index}] {source.title} — {source.url}\n{source.snippet}"
        for index, source in enumerate(sources, 1)
    )


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "name": "ResearchMind API",
        "status": "ok",
        "health": "/api/health",
        "research": "POST /api/research",
    }


@app.post("/api/research", response_model=ResearchResponse)
async def research(request: ResearchRequest) -> ResearchResponse:
    try:
        sources = await _search(request)
        if not sources:
            raise HTTPException(status_code=502, detail="Tavily returned no sources for this topic.")
        context = _sources_text(sources)
        report = await _complete(
            request,
            f"""Research topic: {request.topic}

Write a rigorous, student-friendly research brief in Markdown. Use only the
evidence in the supplied sources and cite claims with [n] markers that match
the source numbers.

Choose the structure that best fits the question, but prefer this order:
1. Executive summary — 2-4 sentences answering the question directly.
2. Key findings — 3-5 clearly titled findings with supporting [n] citations.
3. Evidence at a glance — include a Markdown table when the topic involves
   comparisons, categories, metrics, stages, dates, or multiple entities.
4. Context and implications — explain why the findings matter for a student.
5. Limitations — identify missing, conflicting, dated, or weak evidence.
6. Conclusion — give a concise answer and practical next step.

Formatting rules:
- Use short paragraphs, descriptive headings, bullets, and bold emphasis.
- Add a table only when it improves understanding; do not force one into a
  question where a table is unnatural.
- If the sources contain trustworthy numeric data, include a compact
  comparison or trend table. Never invent numbers, dates, rankings, or quotes.
- For timelines, use a date/event table. For processes, use a numbered flow.
- Keep the report focused and avoid repeating the source snippets.
- Do not add a Sources section; the app renders source cards separately.

Sources:
{context}""",
        )
        critique = await _complete(
            request,
            f"""Review this report for factual grounding, clarity, balance, and citation coverage.
Return a short Markdown checklist with a score out of 10 and two concrete revision suggestions.

Report:
{report}""",
        )
        report = re.sub(r"\n{4,}", "\n\n", report).strip()
        return ResearchResponse(
            topic=request.topic,
            report=report,
            critique=critique.strip(),
            sources=sources,
        )
    except HTTPException:
        raise
    except ProviderError as exc:
        raise HTTPException(status_code=502, detail=f"{exc.provider}: {exc.message}") from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail="The research pipeline could not connect to a provider. Check your internet connection and try again.",
        ) from exc
