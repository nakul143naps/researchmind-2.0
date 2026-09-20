# ResearchMind

<p align="center">
  <strong>A multi-agent AI research assistant built with Streamlit.</strong><br>
  Search the web, read the best sources, write a structured report, and critique the result — in one workflow.
</p>

<p align="center">
  <a href="https://researchmind-ajkrhivt66pw3ijoko7g36.streamlit.app/"><strong>🚀 Live demo</strong></a>
  &nbsp;·&nbsp;
  <a href="https://github.com/nakul143naps/researchmind/issues">Report an issue</a>
  &nbsp;·&nbsp;
  <a href="https://share.streamlit.io/">Deploy your own</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Built%20with-Streamlit-ff4b4b?logo=streamlit&logoColor=white" alt="Built with Streamlit">
  <img src="https://img.shields.io/badge/LLM-OpenRouter-6f42c1" alt="OpenRouter">
  <img src="https://img.shields.io/badge/Search-Tavily-111827" alt="Tavily">
</p>

## What it does

ResearchMind turns a topic into a polished research report through four specialized stages:

```text
Topic
  ↓
Search agent     → finds recent, relevant sources with Tavily
  ↓
Reader agent     → extracts deeper content from a selected source
  ↓
Writer chain     → creates a structured report with sources
  ↓
Critic chain     → scores the report and suggests improvements
```

The Streamlit interface displays the workflow, raw research output, final report, critic feedback, and a Markdown download.

## Features

- 🌐 Recent web research with Tavily
- 📄 Lightweight source extraction with BeautifulSoup
- ✍️ Structured report generation through an OpenAI-compatible OpenRouter model
- 🧐 Dedicated critic pass with score, strengths, and improvement areas
- 🎨 Focused dark UI with pipeline status cards
- ⬇️ Downloadable Markdown reports
- 🔐 Secrets loaded from local `.env` or Streamlit Cloud secrets
- 🧩 Terminal pipeline available through `pipeline.py`

## Live demo

Try the deployed app here:

### [Open ResearchMind →](https://researchmind-ajkrhivt66pw3ijoko7g36.streamlit.app/)

> The live demo requires configured API credentials to run a research request.

## Tech stack

- **UI:** Streamlit
- **Agents and orchestration:** LangChain and LangGraph
- **Language model:** OpenRouter through `langchain-openai`
- **Web search:** Tavily
- **Content extraction:** Requests, BeautifulSoup, and lxml
- **Runtime:** Python 3.10+

## Project structure

| File | Purpose |
| --- | --- |
| `app.py` | Streamlit user interface and interactive workflow |
| `agents.py` | Model configuration, agents, writer chain, and critic chain |
| `tools.py` | Tavily search and URL scraping tools |
| `pipeline.py` | Command-line research pipeline |
| `requirements.txt` | Python dependencies |
| `.env.example` | Safe environment-variable template |

## Run locally (Streamlit)

### 1. Clone the repository

```bash
git clone https://github.com/nakul143naps/researchmind.git
cd researchmind
```

### 2. Create and activate a virtual environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:

```bash
python -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure API keys

Copy `.env.example` to `.env` and add your credentials:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=qwen/qwen3.8-27b:free
TAVILY_API_KEY=your_tavily_api_key
```

### 5. Start the app

```bash
streamlit run app.py
```

Open [http://localhost:8501](http://localhost:8501).

## React + FastAPI development version

The first standalone web client lives in `frontend/` and the request-scoped API in
`backend/`. The original Streamlit app remains the default `app.py` entry point.
Provider keys are entered in the browser and sent only with the active request;
the FastAPI server does not write them to disk or environment variables.

Start the API in PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

In a second terminal, start the React client:

```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The client includes local
browser history, an editable Markdown report, source cards, pipeline progress,
copy/download actions, theme switching, and advanced model/depth controls.

## Deploy ResearchMind 2.0 for free on Render

The React + FastAPI version includes a `render.yaml` Blueprint that creates two
free services: a static React frontend and a Python FastAPI backend. The
original Streamlit production app is not replaced.

1. Create a new public GitHub repository named `researchmind-2.0`.
2. Push this project to that repository.
3. In [Render](https://dashboard.render.com/), choose **New → Blueprint** and
   connect the repository.
4. Review the two services and deploy the Blueprint.
5. Add `OPENROUTER_API_KEY` and `TAVILY_API_KEY` as environment variables on
   the `researchmind-api` service. These are server-side fallback credentials;
   the React app still supports request-scoped user keys.
6. Open the generated `researchmind-web` URL.

Render automatically wires the frontend API URL and backend CORS origin using
the services' public URLs. Free services may sleep when idle, so the first
request after inactivity can take longer.

## Deploy on Streamlit Community Cloud

1. Open [share.streamlit.io](https://share.streamlit.io/) and sign in with GitHub.
2. Select this repository, branch `clean-main`, and main file `app.py`.
3. In **Advanced settings → Secrets**, add:

   ```toml
   OPENROUTER_API_KEY = "your_openrouter_api_key"
   OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct"
   TAVILY_API_KEY = "your_tavily_api_key"
   ```

4. Deploy and open the generated public URL.

## Security notes

- Never commit `.env` or real API keys.
- Use Streamlit Cloud Secrets for deployed credentials.
- `.env` and other environment files are ignored by Git; `.env.example` contains placeholders only.

## Contributing

Issues and pull requests are welcome. If you find a bug or have an improvement, open an issue with:

- the topic or workflow step involved,
- the expected behavior,
- the actual behavior,
- and any relevant error message.

## License

No license has been selected for this repository yet. Add a license before accepting external contributions or redistributing the project.
