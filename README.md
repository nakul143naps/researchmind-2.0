# ResearchMind 2.0

ResearchMind 2.0 is a React + FastAPI research workspace for students. It
searches the web with Tavily, generates cited research with OpenRouter, and
returns an editable, structured Markdown brief with source cards and critique.

The original Streamlit app remains available in `app.py`; this version is the
new local development and deployment track.

## Features

- React + TypeScript + Vite frontend
- FastAPI backend with typed request/response models
- Request-scoped OpenRouter and Tavily keys
- OpenRouter Free Router and selectable models
- Search, writing, and critique pipeline
- Executive summaries, findings, limitations, citations, and conditional tables
- Sanitized Markdown preview with responsive table styling
- Source cards, copy/download actions, browser-local history, dark mode
- Animated task companions and pipeline progress states
- Render Blueprint for a free frontend/backend deployment

## Architecture

```text
React frontend
      │ POST /api/research
      ▼
FastAPI backend ── Tavily search
      │
      ├──────────── OpenRouter report generation
      └──────────── OpenRouter critique
```

## Run locally

Backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Provider keys

The React app accepts keys per request and does not store them in browser
history. Use an active OpenRouter key and Tavily key. The default model is
`openrouter/free`, but free models can still be rate-limited or unavailable.

## Deploy free on Render

This repository includes `render.yaml`, which creates:

- `researchmind-api`: free Python FastAPI web service
- `researchmind-web`: free static React site

Create a Render Blueprint from this repository and add any required provider
environment variables to the API service. Render wires the public frontend and
backend URLs through service references.

## Original Streamlit production app

The deployed Streamlit application remains in the original `researchmind`
repository. This repository is the separate ResearchMind 2.0 development
version and should be promoted only after staging validation.

## Security

- Never commit `.env` or API keys.
- Use HTTPS, strict CORS, rate limits, and secret-safe logs in production.
- Harden any URL scraping against SSRF before public deployment.
