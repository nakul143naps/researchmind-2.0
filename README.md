# ResearchMind 2.0

<p align="center">
  <strong>A professional AI research workspace for students.</strong><br>
  Search the web, compare evidence, generate a cited brief, and refine it with an AI critique.
</p>

<p align="center">
  <a href="https://researchmind-web.onrender.com/">Live Demo</a>
  ·
  <a href="https://github.com/nakul143naps/researchmind-2.0">Repository</a>
  ·
  <a href="https://dashboard.render.com/">Deploy on Render</a>
  ·
  <a href="https://openrouter.ai/keys">Get an OpenRouter key</a>
  ·
  <a href="https://app.tavily.com/">Get a Tavily key</a>
</p>

> **Live demo:** [researchmind-web.onrender.com](https://researchmind-web.onrender.com/)
>
> The demo requires visitors to provide their own OpenRouter and Tavily keys.
> Keys are entered for the active request and are not stored in browser history.

## Overview

ResearchMind 2.0 is the React + FastAPI evolution of the original Streamlit
ResearchMind application. A user enters a research question and the system:

1. searches the web with Tavily,
2. prepares source context,
3. generates an evidence-grounded report with OpenRouter,
4. reviews the report with a second model call,
5. displays citations, source cards, structured Markdown, and limitations.

The original Streamlit app remains in `app.py` and continues to be maintained
in the separate production repository. This repository is the improved
ResearchMind 2.0 track.

## Features

- React, TypeScript, and Vite frontend
- FastAPI backend with Pydantic validation
- User-provided OpenRouter and Tavily keys per request
- OpenRouter Free Router plus selectable free and paid models
- Executive summary, key findings, evidence tables, limitations, and conclusion
- Clickable source cards with snippets and domains
- Editable Markdown report with sanitized preview
- Responsive tables, headings, lists, callouts, copy, and download actions
- Browser-local research history and light/dark themes
- Small task companions synchronized with the research pipeline
- Provider-specific errors and request timeout handling
- Render Blueprint for a free two-service deployment

## Architecture

```text
┌────────────────────┐       POST /api/research       ┌─────────────────────┐
│ React static site  │ ─────────────────────────────▶ │ FastAPI web service │
│ Vite + TypeScript  │                                │ Pydantic + HTTPX   │
└────────────────────┘                                └──────────┬──────────┘
                                                                  │
                         ┌────────────────────────────────────────┼──────────────┐
                         ▼                                        ▼              ▼
                    Tavily search                         OpenRouter writer  OpenRouter critic
                         │                                        │              │
                         └─────────────────────── JSON response ───┴──────────────┘
```

## Repository structure

| Path | Responsibility |
| --- | --- |
| `frontend/src/App.tsx` | React state, form, API request, history, theme, report UI |
| `frontend/src/styles.css` | Responsive visual system, dark mode, report rendering, animations |
| `frontend/package.json` | Frontend scripts and dependencies |
| `backend/main.py` | FastAPI routes, provider calls, validation, orchestration, errors |
| `backend/requirements.txt` | Backend dependencies |
| `render.yaml` | Render frontend/backend Blueprint |
| `app.py` | Original Streamlit application |
| `agents.py`, `tools.py`, `pipeline.py` | Original Streamlit/LangChain pipeline |

## Run locally

### Requirements

- Python 3.10+
- Node.js 18+
- An OpenRouter API key
- A Tavily API key

### Start the backend

From the repository root in PowerShell:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

Verify it:

```text
http://127.0.0.1:8000/api/health
```

Expected response:

```json
{"status":"ok"}
```

### Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The frontend sends requests to `http://localhost:8000` by default. To use a
different backend URL, create `frontend/.env.local`:

```env
VITE_API_URL=https://your-api.example.com
```

## Get an OpenRouter API key

OpenRouter provides one API endpoint for many language models.

1. Create or sign in to your account at
   [openrouter.ai](https://openrouter.ai/).
2. Open the official [API Keys page](https://openrouter.ai/keys).
3. Click **Create Key**.
4. Copy the key immediately and keep it private.
5. Paste it into ResearchMind’s **Advanced → OpenRouter key** field.
6. Select **OpenRouter Free Router** for the best chance of using an available
   free model.

Important:

- A valid key is still required for free models.
- Free models can be rate-limited, temporarily unavailable, or have provider
  restrictions.
- Paid models consume account credits.
- Never commit a key to GitHub or place it in frontend source code.
- Check the official [model catalog](https://openrouter.ai/models) for current
  model availability and pricing.

## Get a Tavily API key

Tavily provides the web-search layer used by ResearchMind.

1. Open the official [Tavily application](https://app.tavily.com/).
2. Create an account or sign in.
3. Open the API-key area in the dashboard.
4. Create or copy an active API key.
5. Paste it into ResearchMind’s **Advanced → Tavily key** field.

Tavily usage is subject to the limits and credits shown in your account. A
single ResearchMind request normally performs one Tavily search and two
OpenRouter generation calls.

## Key handling and security

In the React version, provider keys are held in component state and sent with
the active request. They are not saved in browser history or localStorage.

For public deployment:

- use HTTPS,
- keep CORS restricted to the real frontend origin,
- never log request bodies or authorization headers,
- add rate limits and request quotas,
- use provider-side spending limits,
- rotate keys if they are exposed,
- harden any URL scraping against SSRF,
- add authentication before offering persistent user accounts.

## Deploy for free on Render

`render.yaml` defines two services:

- `researchmind-api`: Python FastAPI web service
- `researchmind-web`: static React site

Deployment steps:

1. Open [Render](https://dashboard.render.com/).
2. Choose **New → Blueprint**.
3. Select this repository and the `main` branch.
4. Use Blueprint name `researchmind-2-0`.
5. Confirm the two services and click **Apply**.
6. Wait for both services to become **Live**.
7. Open the `researchmind-web` URL.

The frontend is configured through the Render service reference
`VITE_API_URL`. Free Render services may sleep while idle, so the first
request after inactivity can take longer.

ResearchMind asks the user for an OpenRouter key and a Tavily key in the
browser for each research request. The current backend does not use provider
keys configured as permanent Render environment variables.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Frontend cannot be reached | Confirm `researchmind-web` is Live and open its URL |
| API health is 200 but research fails | Check both provider keys and the API logs |
| `Failed to fetch` | Check frontend `VITE_API_URL`, CORS, and that the API is Live |
| OpenRouter 401/403 | Key is invalid, restricted, expired, or lacks model access |
| OpenRouter provider error | Try `openrouter/free` or another currently available model |
| Tavily error | Check the Tavily key, account limits, and dashboard status |
| First Render request is slow | Free services may be waking from sleep |

## Development validation

```powershell
cd frontend
npm run build
```

```powershell
cd ..
python -m compileall -q backend
```

## Production status

The original Streamlit application remains the stable production application.
ResearchMind 2.0 is a separate React + FastAPI deployment track and should be
promoted only after staging tests, provider-failure tests, security hardening,
rate limiting, observability, and a rollback plan are complete.
