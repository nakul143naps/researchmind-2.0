import { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { BookOpen, Check, ChevronDown, Clock3, Copy, Download, Moon, Plus, Search, Settings2, Sparkles, Sun, X } from "lucide-react";

type Source = { title: string; url: string; snippet: string; score?: number };
type Result = { topic: string; report: string; critique: string; sources: Source[] };
type HistoryItem = Result & { id: string; createdAt: string };
const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const steps = ["Discover sources", "Read deeply", "Draft your report", "Review for clarity"];
const characterTasks = ["searching", "reading", "writing", "reviewing"] as const;

function App() {
  const [topic, setTopic] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [tavilyKey, setTavilyKey] = useState("");
  const [model, setModel] = useState("openrouter/free");
  const [temperature, setTemperature] = useState(0.2);
  const [maxSources, setMaxSources] = useState(5);
  const [depth, setDepth] = useState<"quick" | "balanced" | "deep">("balanced");
  const [result, setResult] = useState<Result | null>(null);
  const [report, setReport] = useState("");
  const [activeStep, setActiveStep] = useState(-1);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>(() => JSON.parse(localStorage.getItem("researchmind-history") ?? "[]"));
  const [dark, setDark] = useState(() => localStorage.getItem("researchmind-theme") === "dark");
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; localStorage.setItem("researchmind-theme", dark ? "dark" : "light"); }, [dark]);
  useEffect(() => { localStorage.setItem("researchmind-history", JSON.stringify(history.slice(0, 12))); }, [history]);
  const preview = useMemo(() => ({ __html: DOMPurify.sanitize(marked.parse(report) as string) }), [report]);

  async function runResearch() {
    if (!topic.trim() || !openrouterKey.trim() || !tavilyKey.trim()) { setError("Add a research question and both provider keys to begin."); return; }
    setError(""); setResult(null); setReport(""); setActiveStep(0);
    try {
      const timer = window.setInterval(() => setActiveStep((step) => step < 3 ? step + 1 : step), 1800);
      const response = await fetch(`${API}/api/research`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic, openrouter_api_key: openrouterKey, tavily_api_key: tavilyKey, model, temperature, max_sources: maxSources, depth }) });
      window.clearInterval(timer);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail ?? "The research pipeline could not complete.");
      setActiveStep(4); setResult(payload); setReport(payload.report);
      setHistory((items) => [{ ...payload, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...items]);
    } catch (caught) { setActiveStep(-1); setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again."); }
  }
  function load(item: HistoryItem) { setTopic(item.topic); setResult(item); setReport(item.report); setShowHistory(false); setActiveStep(4); }
  async function copyReport() { await navigator.clipboard.writeText(report); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
  function downloadReport() { const blob = new Blob([report], { type: "text/markdown" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${topic.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "researchmind-report"}.md`; anchor.click(); URL.revokeObjectURL(url); }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark"><Sparkles size={16} /></span><span>research<span className="accent">mind</span></span></a><nav><button className="ghost" onClick={() => setShowHistory(true)}><Clock3 size={16} /> History <span className="count">{history.length}</span></button><button className="icon-button" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button></nav></header>
    <main>
      <section className={`hero ${result ? "hero-after-result" : ""}`}>
        <div className="eyebrow"><span className="eyebrow-dot" /> Research, made clearer</div>
        <h1>Start with a question.<br /><em>Leave with clarity.</em></h1>
        <p>Explore complex topics, compare credible sources, and shape ideas you can confidently stand behind.</p>
      </section>
      <section className={`research-card ${result ? "compact" : ""}`}><div className="input-label"><Search size={15} /> What are you curious about?</div><div className="topic-row"><textarea value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. How is generative AI changing higher education?" rows={result ? 2 : 3} /><div className={`input-companion ${topic.trim() ? "is-ready" : ""}`} aria-label={topic.trim() ? "Ready to research" : "Waiting for your question"} role="img"><MiniCharacter task="waiting" active={activeStep < 0} /></div></div><div className="form-footer"><span className="privacy-note">Keys are used for this request only — never stored.</span><button className="settings-button" onClick={() => setShowSettings(!showSettings)}><Settings2 size={16} /> Advanced <ChevronDown size={14} className={showSettings ? "rotate" : ""} /></button><button className="primary-button" onClick={runResearch} disabled={activeStep >= 0 && activeStep < 4}><Sparkles size={16} /> {activeStep >= 0 && activeStep < 4 ? "Researching…" : "Start research"}</button></div>
        {showSettings && <div className="settings-panel"><label>OpenRouter key<input type="password" value={openrouterKey} onChange={(e) => setOpenrouterKey(e.target.value)} placeholder="sk-or-…" /></label><label>Tavily key<input type="password" value={tavilyKey} onChange={(e) => setTavilyKey(e.target.value)} placeholder="tvly-…" /></label><label>Model<select value={model} onChange={(e) => setModel(e.target.value)}><option value="openrouter/free">OpenRouter Free Router · recommended</option><option value="qwen/qwen3.8-27b:free">Qwen 3.8 27B · free</option><option value="inclusionai/ling-3.0-flash-vl:free">Ling 3.0 Flash VL · free</option><option value="nvidia/nemotron-3.5-lightning:free">NVIDIA Nemotron · free</option><option value="meta-llama/llama-3.3-70b-instruct">Llama 3.3 70B · paid</option><option value="openai/gpt-4o-mini">GPT-4o Mini · paid</option></select></label><label>Depth<select value={depth} onChange={(e) => setDepth(e.target.value as typeof depth)}><option value="quick">Quick</option><option value="balanced">Balanced</option><option value="deep">Deep</option></select></label><label>Max sources<span className="range-line"><input type="range" min="1" max="10" value={maxSources} onChange={(e) => setMaxSources(Number(e.target.value))} /><b>{maxSources}</b></span></label><label>Temperature<span className="range-line"><input type="range" min="0" max="1" step="0.1" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} /><b>{temperature.toFixed(1)}</b></span></label></div>}
      </section>
      {error && <div className="error-banner"><X size={18} /><span>{error}</span></div>}
      {activeStep >= 0 && <section className="pipeline"><div className="section-kicker">Research pipeline <span>{activeStep >= 4 ? "Complete" : "In progress"}</span></div><div className="step-row">{steps.map((step, index) => <div className={`step ${index < activeStep ? "done" : index === activeStep ? "current" : ""}`} key={step}><MiniCharacter task={characterTasks[index]} active={index === activeStep} done={index < activeStep || activeStep >= 4} /><div className="step-icon">{index < activeStep || activeStep >= 4 ? <Check size={14} /> : index === activeStep ? <span className="pulse" /> : index + 1}</div><span>{step}</span></div>)}</div></section>}
      {result && <section className="results-grid"><div className="report-column"><div className="result-heading"><div><div className="eyebrow">Your research brief</div><h2>{result.topic}</h2></div><div className="actions"><button className="icon-button" onClick={copyReport} title="Copy Markdown">{copied ? <Check size={17} /> : <Copy size={17} />}</button><button className="icon-button" onClick={downloadReport} title="Download Markdown"><Download size={17} /></button></div></div><div className="editor-tabs"><span className="active">Edit report</span><span>Preview</span></div><textarea className="report-editor" value={report} onChange={(e) => setReport(e.target.value)} /><div className="markdown-preview" dangerouslySetInnerHTML={preview} /></div><aside className="sources-column"><div className="aside-heading"><BookOpen size={17} /><h3>Sources</h3><span>{result.sources.length}</span></div><p className="aside-subtitle">References used in this brief</p>{result.sources.map((source, index) => <a className="source-card" href={source.url} target="_blank" rel="noreferrer" key={`${source.url}-${index}`}><div className="source-number">{String(index + 1).padStart(2, "0")}</div><div><h4>{source.title}</h4><p>{source.snippet}</p><small>{hostFor(source.url)} ↗</small></div></a>)}<div className="critique-card"><div className="section-kicker">A second look</div><div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(marked.parse(result.critique) as string) }} /></div></aside></section>}
      {!result && <div className="example-row"><span>Try exploring</span>{["The future of public libraries", "Climate adaptation in cities", "How memory is formed"].map((example) => <button key={example} onClick={() => setTopic(example)}>{example} <Plus size={13} /></button>)}</div>}
    </main>
    {showHistory && <div className="modal-backdrop" onClick={() => setShowHistory(false)}><div className="history-modal" onClick={(e) => e.stopPropagation()}><div className="modal-heading"><h2>Research history</h2><button className="icon-button" onClick={() => setShowHistory(false)}><X size={18} /></button></div>{history.length ? history.map((item) => <button className="history-item" onClick={() => load(item)} key={item.id}><span>{item.topic}</span><small>{new Date(item.createdAt).toLocaleDateString()}</small></button>) : <p className="empty-state">Your completed briefs will appear here.</p>}</div></div>}
  </div>;
}

function hostFor(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Source link";
  }
}

function MiniCharacter({ task, active, done = false }: { task: string; active: boolean; done?: boolean }) {
  return <span className={`mini-character mini-${task} ${active ? "mini-active" : ""} ${done ? "mini-done" : ""}`} aria-hidden="true">
    <span className="mini-face"><i /><i /><b /></span>
    <span className="mini-prop">{task === "searching" ? "⌕" : task === "reading" ? "▤" : task === "writing" ? "✎" : task === "reviewing" ? "✓" : "⋯"}</span>
  </span>;
}

export default App;
