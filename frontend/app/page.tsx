"use client";

import React, { useState, useEffect, useRef } from "react";
import { analyzeRepository, askRepository } from "../lib/api";
import { ArchitectureModule, IssueSummary, RepositoryAnalysis, AskResponse } from "../types/repository";
import GitDiagramViewer from "../components/GitDiagramViewer";

const PRELOADED_REPOS = [
  "https://github.com/tiangolo/fastapi",
  "https://github.com/astral-sh/uv",
  "https://github.com/pallets/flask",
  "https://github.com/encode/httpx",
];

function generateMermaidDiagram(analysis: RepositoryAnalysis): string {
  if (analysis.mermaid_diagram && analysis.mermaid_diagram.trim().length > 0) {
    return analysis.mermaid_diagram;
  }

  const isFastapi = analysis.full_name.toLowerCase().includes("fastapi");
  if (isFastapi) {
    return `graph TD
  Client(["HTTP Client"])
  Client -->|REST API / CLI| App

  subgraph Request_Execution ["Request Execution"]
    App["FastAPI App<br/>(applications.py)"]
    Middleware["Middleware stack<br/>(middleware.py)"]
    Router["Router dispatch<br/>(routing.py)"]
    RespEncode["Response encoding<br/>(responses.py)"]
    ExcHandle["Exception handling<br/>(exceptions.py)"]
    DepSolving["Dependency solving<br/>(params.py)"]
    HTTPResp["HTTP responses<br/>(responses.py)"]

    App -->|dispatches| Middleware
    Middleware -->|dispatches| Router
    Router -->|encodes result| RespEncode
    Router -->|handles failures| ExcHandle
    Router -->|resolves input| DepSolving
    Router -->|creates request| HTTPResp
  end

  subgraph Protocols ["Protocols and extensions"]
    WebSockets["WebSocket support<br/>(websockets.py)"]
    Templating["Template responses<br/>(templating.py)"]
    Background["Background tasks<br/>(background.py)"]
    StaticFiles["Static files<br/>(staticfiles.py)"]
    ServerEvents["Server events<br/>(sse.py)"]
    DataValidation["Data validation"]

    Router -->|interactive sockets| WebSockets
    Router -->|renders templates| Templating
    Router -->|executes tasks| Background
    Router -->|serves static data| StaticFiles
    Router -->|supports event streams| ServerEvents
    Router -->|configures middleware| DataValidation
  end

  subgraph Documentation ["API documentation"]
    InteractiveDocs["Interactive docs<br/>(swagger)"]
    OpenAPIGen["OpenAPI generation<br/>(utils.py)"]

    App -->|generates schema| InteractiveDocs
    InteractiveDocs -->|builds schema| OpenAPIGen
  end

  subgraph Security ["Types and security"]
    SecSchemes["Security schemes"]
    OAuth["Path/OAuth authentication<br/>(security.py)"]
    ModelComp["Model compatibility<br/>(types.py)"]

    Router -->|enforces token auth| SecSchemes
    Router -->|validates payload| OAuth
    Router -->|resolves models| ModelComp
  end

  UserEndpoint["User endpoint"]
  Router -->|invokes endpoint| UserEndpoint
  UserEndpoint -->|returns value| Router

  classDef clientClass fill:#e0f2fe,stroke:#0284c7,stroke-width:1.5px,color:#0369a1,rx:20px;
  classDef execClass fill:#e0f2fe,stroke:#0284c7,stroke-width:1.5px,color:#0369a1,rx:6px;
  classDef protocolClass fill:#ffe4e6,stroke:#f43f5e,stroke-width:1.5px,color:#9f1239,rx:6px;
  classDef docClass fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#166534,rx:6px;
  classDef secClass fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e,rx:6px;
  classDef endpointClass fill:#e0e7ff,stroke:#6366f1,stroke-width:1.5px,color:#3730a3,rx:6px;

  class Client clientClass;
  class App,Middleware,Router,RespEncode,ExcHandle,DepSolving,HTTPResp execClass;
  class WebSockets,Templating,Background,StaticFiles,ServerEvents,DataValidation protocolClass;
  class InteractiveDocs,OpenAPIGen docClass;
  class SecSchemes,OAuth,ModelComp secClass;
  class UserEndpoint endpointClass;`;
  }

  // Dynamic GitDiagram flowchart for any other repository
  const cleanId = (str: string) => str.replace(/[^a-zA-Z0-9_]/g, "_");
  const lines: string[] = [
    "graph TD",
    '  Client(["🌐 Client / Developer"])',
    '  Client -->|invokes / requests| App',
    '  subgraph Request_Execution ["Request Execution"]',
    `    App["📦 ${analysis.full_name}<br/>(${analysis.recommended_entrypoint || "entrypoint"})"]`,
    '    Dispatcher["⚙️ Core Dispatcher<br/>(engine)"]',
    '    Handler["⚡ Action Router<br/>(controller)"]',
    '    App -->|dispatches| Dispatcher',
    '    Dispatcher -->|routes request| Handler',
    '  end',
  ];

  if (analysis.modules.length > 0) {
    lines.push('  subgraph Protocols ["Protocols and extensions"]');
    analysis.modules.slice(0, 3).forEach((mod, idx) => {
      const modId = `Sub_${idx}_${cleanId(mod.id)}`;
      const modName = mod.name.replace("Module: ", "");
      lines.push(`    ${modId}["🧩 ${modName}<br/>(${mod.path})"]`);
      lines.push(`    Handler -->|delegates task| ${modId}`);
    });
    lines.push('  end');
  }

  lines.push(
    '  subgraph Documentation ["API documentation"]',
    '    APISpec["📄 Documentation & Specs<br/>(api/docs)"]',
    '    App -->|exposes schema| APISpec',
    '  end',
    '  subgraph Security ["Types and security"]',
    '    Validation["🛡️ Schema & Type Validation<br/>(models/types)"]',
    '    Handler -->|validates payload| Validation',
    '  end',
    '  UserEndpoint["🎯 Output / Result"]',
    '  Handler -->|returns result| UserEndpoint',
    '  classDef clientClass fill:#e0f2fe,stroke:#0284c7,stroke-width:1.5px,color:#0369a1,rx:20px;',
    '  classDef execClass fill:#e0f2fe,stroke:#0284c7,stroke-width:1.5px,color:#0369a1,rx:6px;',
    '  classDef protocolClass fill:#ffe4e6,stroke:#f43f5e,stroke-width:1.5px,color:#9f1239,rx:6px;',
    '  classDef docClass fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#166534,rx:6px;',
    '  classDef secClass fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#92400e,rx:6px;',
    '  classDef endpointClass fill:#e0e7ff,stroke:#6366f1,stroke-width:1.5px,color:#3730a3,rx:6px;',
    '  class Client clientClass;',
    '  class App,Dispatcher,Handler execClass;',
    '  class APISpec docClass;',
    '  class Validation secClass;',
    '  class UserEndpoint endpointClass;'
  );

  return lines.join("\n");
}

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("https://github.com/tiangolo/fastapi");
  const [activeTab, setActiveTab] = useState<"arch" | "contributors" | "issues" | "path" | "ask">("arch");
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Inspector States
  const [selectedModule, setSelectedModule] = useState<ArchitectureModule | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<IssueSummary | null>(null);

  // Terminal States
  const [terminalQuery, setTerminalQuery] = useState("Where are router definitions and request handlers initialized?");
  const [terminalLoading, setTerminalLoading] = useState(false);
  const [terminalResult, setTerminalResult] = useState<AskResponse | null>(null);
  const [terminalError, setTerminalError] = useState<string | null>(null);

  const workspaceRef = useRef<HTMLElement>(null);

  const handleAnalyze = async (urlToAnalyze?: string) => {
    const target = (urlToAnalyze || repoUrl).trim();
    if (!target) return;

    setLoading(true);
    setError(null);
    setLoadingStep(1);

    const stepTimer1 = setTimeout(() => setLoadingStep(2), 500);
    const stepTimer2 = setTimeout(() => setLoadingStep(3), 1200);

    try {
      const data = await analyzeRepository(target);
      setAnalysis(data);
      if (data.modules && data.modules.length > 0) {
        setSelectedModule(data.modules[0]);
      }
      if (data.issues && data.issues.length > 0) {
        setSelectedIssue(data.issues[0]);
      }
      setTerminalResult(null);
      setTimeout(() => {
        workspaceRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze repository");
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setLoading(false);
    }
  };

  const handleAsk = async (queryText?: string) => {
    const query = (queryText || terminalQuery).trim();
    if (!query || !analysis) return;

    setTerminalLoading(true);
    setTerminalError(null);
    try {
      const res = await askRepository(`https://github.com/${analysis.full_name}`, query);
      setTerminalResult(res);
    } catch (err) {
      setTerminalError(err instanceof Error ? err.message : "Q&A query failed");
    } finally {
      setTerminalLoading(false);
    }
  };

  // Pre-load initial analysis on mount
  useEffect(() => {
    handleAnalyze("https://github.com/tiangolo/fastapi");
  }, []);

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface">
      {/* HEADER NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-primary-container border-b-2 border-black">
        <div className="h-20 max-w-[1440px] mx-auto px-margin flex items-center justify-between gap-gutter">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 bg-black border-2 border-black flex items-center justify-center shrink-0 brutal-shadow-sm">
              <span className="material-symbols-outlined text-primary-container font-bold text-2xl">radar</span>
            </div>
            <a href="#" className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight font-bold hover:text-black">
              SPARK
            </a>
          </div>

          <nav className="hidden lg:flex items-center gap-space-xs">
            <button
              onClick={() => { setActiveTab("arch"); workspaceRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              className={`font-headline-sm text-sm uppercase px-3 py-1.5 border-2 border-transparent hover:border-black font-bold transition-all ${
                activeTab === "arch" ? "border-black bg-surface-container-lowest" : ""
              }`}
            >
              Architecture
            </button>
            <button
              onClick={() => { setActiveTab("contributors"); workspaceRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              className={`font-headline-sm text-sm uppercase px-3 py-1.5 border-2 border-transparent hover:border-black font-bold transition-all ${
                activeTab === "contributors" ? "border-black bg-surface-container-lowest" : ""
              }`}
            >
              Contributors
            </button>
            <button
              onClick={() => { setActiveTab("issues"); workspaceRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              className={`font-headline-sm text-sm uppercase px-3 py-1.5 border-2 border-transparent hover:border-black font-bold transition-all ${
                activeTab === "issues" ? "border-black bg-surface-container-lowest" : ""
              }`}
            >
              Issues
            </button>
            <button
              onClick={() => { setActiveTab("path"); workspaceRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              className={`font-headline-sm text-sm uppercase px-3 py-1.5 border-2 border-transparent hover:border-black font-bold transition-all ${
                activeTab === "path" ? "border-black bg-surface-container-lowest" : ""
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => { setActiveTab("ask"); workspaceRef.current?.scrollIntoView({ behavior: "smooth" }); }}
              className={`font-headline-sm text-sm uppercase px-3 py-1.5 border-2 border-transparent hover:border-black font-bold transition-all ${
                activeTab === "ask" ? "border-black bg-surface-container-lowest" : ""
              }`}
            >
              Ask AI
            </button>
          </nav>

          <div className="flex items-center gap-space-sm">
            <a
              href={analysis ? `https://github.com/${analysis.full_name}` : "https://github.com"}
              target="_blank"
              rel="noreferrer"
              className="brutal-btn flex items-center gap-1.5 px-3 py-2 border-2 border-black bg-surface-container-lowest font-headline-sm text-label-md uppercase font-bold brutal-shadow-sm text-on-surface hover:bg-black hover:text-primary-container"
            >
              <span className="material-symbols-outlined text-[18px]">terminal</span>
              <span>GitHub</span>
            </a>
            <button
              onClick={() => workspaceRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="brutal-btn hidden sm:inline-flex items-center justify-center font-headline-sm text-label-md uppercase bg-black text-primary-container border-2 border-black px-space-md py-2 brutal-shadow-md font-bold"
            >
              WORKSPACE
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="w-full pt-20">
        {/* HERO SECTION */}
        <section
          className="relative w-full bg-primary-container border-b-2 border-black py-space-xl lg:py-24 px-margin overflow-hidden"
          style={{
            backgroundImage: "radial-gradient(rgba(0,0,0,0.14) 2px, transparent 2px)",
            backgroundSize: "32px 32px",
          }}
        >
          <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-center relative z-10">
            <div className="lg:col-span-7 flex flex-col items-start gap-space-md">
              <div className="inline-flex items-center gap-2 bg-surface-container-lowest border-2 border-black px-3.5 py-1.5 brutal-shadow-sm font-label-sm text-label-sm tracking-wider uppercase">
                <span className="w-2.5 h-2.5 bg-black"></span>
                <span>AI-POWERED REPOSITORY INTELLIGENCE</span>
              </div>

              <h1 className="font-headline-xl text-3xl md:text-5xl lg:text-[54px] leading-[1.08] tracking-tight uppercase font-bold text-on-surface">
                UNDERSTAND OPEN SOURCE. <br className="hidden sm:inline" />
                <span className="text-transparent" style={{ WebkitTextStroke: "2.5px rgb(0, 0, 0)" }}>
                  CONTRIBUTE
                </span>{" "}
                WITH PURPOSE.
              </h1>

              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl font-medium">
                Explore any GitHub repository, demystify its architectural graph, discover module owners, and identify the
                exact entrypoint issue tailored to your skills.
              </p>

              {/* INPUT BAR */}
              <div className="w-full max-w-2xl mt-space-sm">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAnalyze();
                  }}
                  className="flex flex-col sm:flex-row items-stretch gap-space-xs bg-surface-container-lowest border-2 border-black p-2 brutal-shadow-lg"
                >
                  <div className="flex-1 flex items-center px-3 gap-2">
                    <span className="material-symbols-outlined text-black font-bold">search</span>
                    <input
                      className="w-full bg-transparent font-label-md text-label-md outline-none text-black placeholder:text-outline font-semibold"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="Enter GitHub URL (e.g. https://github.com/org/repo)"
                      type="text"
                    />
                  </div>
                  <button
                    disabled={loading}
                    className="brutal-btn bg-black text-primary-container font-headline-sm text-label-md uppercase px-6 py-3.5 border-2 border-black tracking-wide font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    type="submit"
                  >
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    <span>{loading ? "ANALYZING..." : "ANALYZE REPOSITORY"}</span>
                  </button>
                </form>

                {/* PRELOADED REPO TARGETS */}
                <div className="flex flex-wrap items-center gap-space-xs mt-space-sm font-label-sm text-label-sm">
                  <span className="text-on-surface-variant uppercase font-semibold">PRELOADED TARGETS:</span>
                  {PRELOADED_REPOS.map((preset) => {
                    const label = preset.replace("https://github.com/", "");
                    return (
                      <button
                        key={preset}
                        onClick={() => {
                          setRepoUrl(preset);
                          handleAnalyze(preset);
                        }}
                        className="brutal-btn bg-surface-container-lowest border-2 border-black px-2 py-0.5 uppercase hover:bg-black hover:text-primary-container"
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* HERO RIGHT COLUMN: REPOSITORY CARD PREVIEW */}
            <div className="lg:col-span-5 w-full">
              <div className="bg-surface-container-lowest border-2 border-black brutal-shadow-lg overflow-hidden">
                <div className="bg-black text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-black">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-[#e85e5e] border border-black inline-block"></span>
                    <span className="w-3 h-3 bg-[#f5bc42] border border-black inline-block"></span>
                    <span className="w-3 h-3 bg-[#42bf68] border border-black inline-block"></span>
                    <span className="font-label-sm text-label-sm text-tertiary-fixed ml-2">
                      {analysis ? analysis.full_name : "LIVE WORKBENCH"}
                    </span>
                  </div>
                  <div className="font-label-sm text-label-sm text-primary-container uppercase">
                    {loading ? "SYNTHESIZING..." : "ONLINE // VERIFIED"}
                  </div>
                </div>

                <div className="p-space-md flex flex-col gap-space-sm bg-surface">
                  <div className="flex items-center justify-between border-2 border-black p-2.5 bg-surface-container-lowest">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-primary">data_object</span>
                      <span className="font-headline-sm text-body-md font-bold">
                        {analysis ? analysis.full_name : "Loading repo..."}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-label-sm text-label-sm">
                      <span className="bg-tertiary-container px-2 py-0.5 border border-black font-semibold">
                        ★ {analysis ? analysis.stars.toLocaleString() : "0"}
                      </span>
                      <span className="bg-surface-container px-2 py-0.5 border border-black">
                        {analysis?.language ? analysis.language.toUpperCase() : "CODEBASE"}
                      </span>
                    </div>
                  </div>

                  {/* Architecture quick preview */}
                  <div className="border-2 border-black p-3 bg-surface-container-lowest flex flex-col gap-2">
                    <span className="font-label-sm text-label-sm uppercase text-on-surface-variant font-bold">
                      // TOP LEVEL STRUCTURE
                    </span>
                    <div className="grid grid-cols-2 gap-2 font-label-sm">
                      {(analysis?.top_level_paths || ["src", "app", "tests", "docs"]).slice(0, 4).map((p, i) => (
                        <div
                          key={p}
                          className={`p-2 border border-black flex items-center justify-between ${
                            i === 0 ? "bg-primary-container font-bold border-2" : "bg-surface-container"
                          }`}
                        >
                          <span>/{p}</span>
                          <span className="text-xs bg-black text-white px-1">DIR</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Recommended Issue */}
                  {analysis?.issues && analysis.issues.length > 0 && (
                    <div className="border-2 border-black p-3 bg-secondary-container brutal-shadow-sm flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-label-sm text-label-sm bg-black text-white px-1.5 py-0.5">
                          ISSUE #{analysis.issues[0].number}
                        </span>
                        <span className="font-label-sm text-label-sm bg-primary-container text-black px-1.5 py-0.5 border border-black font-bold uppercase">
                          {analysis.issues[0].difficulty}
                        </span>
                      </div>
                      <div className="font-headline-sm text-body-md font-bold text-on-secondary-container mt-1 truncate">
                        {analysis.issues[0].title}
                      </div>
                      <div className="font-label-sm text-[11px] text-on-secondary-fixed-variant line-clamp-1">
                        {analysis.issues[0].rationale}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LOADING TELEMETRY BANNER */}
        {loading && (
          <div className="max-w-[1440px] mx-auto px-margin py-4">
            <div className="border-2 border-black bg-primary-container p-4 brutal-shadow-md">
              <div className="flex items-center justify-between pb-2 border-b-2 border-black mb-3">
                <span className="font-label-sm text-label-sm bg-black text-white px-2 py-0.5 uppercase">
                  AGENT PIPELINE
                </span>
                <span className="font-label-sm text-label-sm font-bold animate-pulse">
                  STEP {loadingStep} OF 3 IN PROGRESS...
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-label-sm text-label-sm">
                <div
                  className={`p-2 border border-black flex items-center gap-2 ${
                    loadingStep >= 1 ? "bg-white font-bold" : "bg-surface-container opacity-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {loadingStep > 1 ? "check_circle" : "sync"}
                  </span>
                  <span>1. Ingest GitHub API & Tree</span>
                </div>
                <div
                  className={`p-2 border border-black flex items-center gap-2 ${
                    loadingStep >= 2 ? "bg-white font-bold" : "bg-surface-container opacity-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {loadingStep > 2 ? "check_circle" : "sync"}
                  </span>
                  <span>2. Structural Graph Clustering</span>
                </div>
                <div
                  className={`p-2 border border-black flex items-center gap-2 ${
                    loadingStep >= 3 ? "bg-white font-bold" : "bg-surface-container opacity-50"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">sync</span>
                  <span>3. Gemma 4 Reasoning & Roadmap</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ERROR BANNER */}
        {error && (
          <div className="max-w-[1440px] mx-auto px-margin py-4">
            <div className="border-2 border-black bg-error-container text-on-error-container p-4 brutal-shadow-md flex items-center gap-3">
              <span className="material-symbols-outlined font-bold text-2xl text-error">error</span>
              <div>
                <div className="font-bold uppercase text-sm">Analysis Request Failed</div>
                <div className="text-body-sm">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* LIVE WORKSPACE SECTION */}
        {analysis && (
          <section ref={workspaceRef} className="w-full bg-surface py-space-xl px-margin border-b-2 border-black">
            <div className="max-w-[1440px] mx-auto flex flex-col gap-space-md">
              {/* Workspace Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black text-white p-3 border-2 border-black brutal-shadow-md">
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm bg-primary-container text-black font-bold px-2 py-0.5 uppercase">
                    LIVE WORKSPACE
                  </span>
                  <span className="font-headline-sm text-sm uppercase text-secondary-fixed tracking-wide">
                    {analysis.full_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://github.com/${analysis.full_name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-surface-container-lowest text-black font-label-sm text-label-sm uppercase font-bold border border-black hover:bg-primary-container flex items-center gap-1"
                  >
                    <span>Open in GitHub</span>
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </a>
                </div>
              </div>

              {/* Workspace Header Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm bg-surface-container-lowest border-2 border-black p-space-md brutal-shadow-lg">
                <div className="flex flex-wrap items-center gap-space-sm">
                  <div className="w-12 h-12 bg-black text-primary-container flex items-center justify-center border-2 border-black">
                    <span className="material-symbols-outlined text-3xl font-bold">account_tree</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-headline-sm uppercase font-bold">
                        {analysis.full_name}
                      </span>
                      <span className="font-label-sm text-label-sm bg-primary-container px-2 py-0.5 border border-black font-bold">
                        PUBLIC REPO
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 font-label-sm text-label-sm text-on-surface-variant mt-1">
                      <span>{analysis.language ? analysis.language.toUpperCase() : "GENERAL"}</span>
                      <span>•</span>
                      <span>{analysis.license_name || "OPEN SOURCE"}</span>
                      <span>•</span>
                      <span className="text-black font-bold">★ {analysis.stars.toLocaleString()} STARS</span>
                      <span>•</span>
                      <span>{analysis.forks.toLocaleString()} FORKS</span>
                      <span>•</span>
                      <span className="text-error font-bold">{analysis.open_issues} OPEN ISSUES</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-secondary-container border-2 border-black px-3 py-2 brutal-shadow-sm">
                  <span className="w-2.5 h-2.5 bg-primary rounded-full animate-ping"></span>
                  <span className="font-label-sm text-label-sm font-bold uppercase text-on-secondary-container">
                    GEMMA REASONING ON {analysis.default_branch.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* TAB BUTTONS */}
              <div className="flex overflow-x-auto gap-1 border-b-2 border-black pb-1 font-headline-sm text-sm uppercase">
                <button
                  onClick={() => setActiveTab("arch")}
                  className={`px-4 py-2 border-2 border-black font-bold brutal-shadow-sm transition-all ${
                    activeTab === "arch"
                      ? "bg-black text-primary-container"
                      : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                  }`}
                >
                  01. Architecture Graph
                </button>
                <button
                  onClick={() => setActiveTab("contributors")}
                  className={`px-4 py-2 border-2 border-black font-bold brutal-shadow-sm transition-all ${
                    activeTab === "contributors"
                      ? "bg-black text-primary-container"
                      : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                  }`}
                >
                  02. People Intelligence
                </button>
                <button
                  onClick={() => setActiveTab("issues")}
                  className={`px-4 py-2 border-2 border-black font-bold brutal-shadow-sm transition-all ${
                    activeTab === "issues"
                      ? "bg-black text-primary-container"
                      : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                  }`}
                >
                  03. Issue Recommender
                </button>
                <button
                  onClick={() => setActiveTab("path")}
                  className={`px-4 py-2 border-2 border-black font-bold brutal-shadow-sm transition-all ${
                    activeTab === "path"
                      ? "bg-black text-primary-container"
                      : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                  }`}
                >
                  04. Contribution Path
                </button>
                <button
                  onClick={() => setActiveTab("ask")}
                  className={`px-4 py-2 border-2 border-black font-bold brutal-shadow-sm transition-all ${
                    activeTab === "ask"
                      ? "bg-black text-primary-container"
                      : "bg-surface-container-lowest text-on-surface hover:bg-surface-container"
                  }`}
                >
                  05. Ask Repo Terminal
                </button>
              </div>

              {/* AI ARCHITECTURAL OVERVIEW SUMMARY */}
              <div className="border-2 border-black bg-primary-container p-space-md brutal-shadow-md">
                <div className="font-label-sm text-label-sm font-bold bg-black text-primary-container inline-block px-2 py-0.5 uppercase mb-2">
                  // GEMMA 4 VERIFIED ARCHITECTURAL SUMMARY
                </div>
                <p className="font-body-md text-body-md text-on-surface font-medium max-w-4xl">
                  {analysis.ai_summary || analysis.description || "Analysis generated for open source onboarding."}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm mt-3 pt-3 border-t-2 border-black font-label-sm text-label-sm">
                  <div>
                    <strong className="uppercase text-black">Primary Stack: </strong>
                    <span>{analysis.primary_dependency || analysis.language || "Standard Toolchain"}</span>
                  </div>
                  <div>
                    <strong className="uppercase text-black">Architecture Pattern: </strong>
                    <span>{analysis.architecture_pattern || "Modular Subsystems"}</span>
                  </div>
                  <div>
                    <strong className="uppercase text-black">Recommended Entrypoint: </strong>
                    <span className="bg-black text-primary-container px-1 font-bold">
                      {analysis.recommended_entrypoint || analysis.top_level_paths[0] || "README.md"}
                    </span>
                  </div>
                </div>
              </div>

              {/* TAB 1: DYNAMIC ARCHITECTURE GRAPH (GITDIAGRAM STYLE) */}
              {activeTab === "arch" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                  {/* GitDiagram Visual Node Diagram Canvas */}
                  <div className="lg:col-span-8 flex flex-col gap-space-sm min-w-0 max-w-full overflow-hidden">
                    {/* Quick Module Filter Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 font-label-sm text-[11px] p-2 bg-surface-container-lowest border-2 border-black brutal-shadow-sm">
                      <span className="text-on-surface-variant font-bold uppercase mr-1">SELECT DOMAIN:</span>
                      {analysis.modules.map((mod) => (
                        <button
                          key={mod.id}
                          onClick={() => setSelectedModule(mod)}
                          className={`px-2 py-0.5 border border-black font-bold uppercase transition-all ${
                            selectedModule?.id === mod.id
                              ? "bg-primary-container text-black brutal-shadow-sm"
                              : "bg-surface-container hover:bg-black hover:text-white"
                          }`}
                        >
                          {mod.name.replace("Module: ", "")}
                        </button>
                      ))}
                    </div>

                    {/* LIVE GITDIAGRAM SVG ENGINE WITH PAN & ZOOM */}
                    <GitDiagramViewer
                      spec={generateMermaidDiagram(analysis)}
                      repoName={analysis.full_name}
                      modules={analysis.modules}
                      onSelectModule={(mod) => setSelectedModule(mod)}
                      onRegenerate={() => handleAnalyze()}
                    />
                  </div>

                  {/* Module Inspector Drawer (Right Column) */}
                  <div className="lg:col-span-4 border-2 border-black bg-surface-container-lowest p-space-md brutal-shadow-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-space-sm">
                        <span className="font-label-sm text-label-sm bg-black text-white px-2 py-0.5 uppercase">
                          MODULE INSPECTOR
                        </span>
                        <span className="font-label-sm text-label-sm text-primary font-bold">
                          {selectedModule?.scope || "CORE SUBSYSTEM"}
                        </span>
                      </div>

                      <h3 className="font-headline-md text-headline-md font-bold uppercase mb-1">
                        {selectedModule?.name || "Select a module"}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
                        {selectedModule?.description || "Select a module node to view associated files and maintainer details."}
                      </p>

                      <div className="flex flex-col gap-space-xs font-label-sm text-label-sm">
                        <span className="font-bold uppercase text-on-surface">Associated Files & Paths:</span>
                        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                          {selectedModule?.files && selectedModule.files.length > 0 ? (
                            selectedModule.files.map((file, i) => (
                              <div
                                key={i}
                                className="p-1.5 border border-black bg-surface-container flex items-center justify-between font-mono text-xs"
                              >
                                <span className="truncate">{file}</span>
                                <span className="text-xs text-on-surface-variant shrink-0 ml-2">LIVE</span>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 border border-black bg-surface-container text-xs">
                              {selectedModule?.path || "/"}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Suggested Reviewers */}
                      <div className="mt-space-sm flex flex-col gap-space-xs font-label-sm text-label-sm">
                        <span className="font-bold uppercase text-on-surface">Suggested Reviewers:</span>
                        <div className="flex flex-wrap items-center gap-2">
                          {analysis.contributors.slice(0, 3).map((c) => (
                            <span
                              key={c.login}
                              className="border border-black bg-primary-container px-2 py-0.5 font-bold text-xs"
                            >
                              @{c.login}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveTab("issues")}
                      className="brutal-btn mt-space-md w-full py-2.5 bg-black text-primary-container border-2 border-black font-headline-sm text-label-md uppercase tracking-wide font-bold"
                    >
                      VIEW MODULE ISSUES
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: PEOPLE INTELLIGENCE (CONTRIBUTORS) */}
              {activeTab === "contributors" && (
                <div className="flex flex-col gap-space-md">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">
                      ACTIVE CORE COMMITTERS & MAINTAINERS ({analysis.contributors.length})
                    </span>
                    <span className="font-label-sm text-label-sm bg-black text-white px-2 py-0.5 uppercase">
                      VERIFIED VIA GITHUB API
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-gutter">
                    {analysis.contributors.map((c) => (
                      <div
                        key={c.login}
                        className="border-2 border-black bg-surface-container-lowest p-space-md brutal-shadow-md flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-space-sm pb-space-sm border-b-2 border-black">
                            <img
                              src={c.avatar_url || "https://github.com/identicons/app.png"}
                              alt={c.login}
                              className="w-12 h-12 border-2 border-black bg-primary-container object-cover"
                            />
                            <div>
                              <div className="font-headline-sm text-body-md font-bold truncate">@{c.login}</div>
                              <div className="font-label-sm text-[11px] text-on-surface-variant">
                                {c.contributions} COMMITS
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 font-label-sm text-label-sm">
                            <div className="flex items-center justify-between">
                              <span>Role:</span>
                              <span className="bg-primary-container px-2 py-0.5 border border-black font-bold text-xs">
                                CORE MAINTAINER
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Activity:</span>
                              <span className="font-bold">Active in {analysis.language || "Code"}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-space-md pt-2 border-t-2 border-black flex items-center justify-between font-label-sm text-label-sm">
                          <a
                            href={c.html_url || `https://github.com/${c.login}`}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline font-bold text-xs flex items-center gap-1"
                          >
                            <span>PROFILE</span>
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          </a>
                          <span className="bg-black text-white px-2 py-0.5 text-xs">PING ON PR</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: ISSUE RECOMMENDER */}
              {activeTab === "issues" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
                  {/* Issue List */}
                  <div className="lg:col-span-7 flex flex-col gap-space-sm">
                    {analysis.issues.length === 0 ? (
                      <div className="p-8 border-2 border-black bg-surface-container text-center">
                        No open issues found for this repository.
                      </div>
                    ) : (
                      analysis.issues.map((issue) => {
                        const isSelected = selectedIssue?.number === issue.number;
                        return (
                          <div
                            key={issue.number}
                            onClick={() => setSelectedIssue(issue)}
                            className={`border-2 border-black p-space-md brutal-shadow-sm cursor-pointer brutal-btn transition-all ${
                              isSelected
                                ? "bg-primary-container brutal-shadow-md scale-[1.01]"
                                : "bg-surface-container-lowest hover:bg-surface-container"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-label-sm text-label-sm bg-black text-white px-2 py-0.5 font-bold">
                                #{issue.number}
                              </span>
                              <span
                                className={`font-label-sm text-label-sm px-2 py-0.5 border border-black font-bold uppercase ${
                                  issue.difficulty === "BEGINNER" ? "bg-primary text-white" : "bg-tertiary-container"
                                }`}
                              >
                                {issue.difficulty}
                              </span>
                            </div>
                            <h4 className="font-headline-sm text-body-lg font-bold uppercase mb-2">
                              {issue.title}
                            </h4>
                            <p className="font-body-sm text-body-sm text-on-surface-variant mb-3 line-clamp-2">
                              {issue.rationale}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 font-label-sm text-label-sm">
                              {issue.labels.slice(0, 3).map((lbl) => (
                                <span key={lbl} className="bg-white px-2 py-0.5 border border-black text-xs font-semibold">
                                  {lbl}
                                </span>
                              ))}
                              {issue.touch_files.length > 0 && (
                                <span className="text-xs text-on-surface-variant ml-auto font-mono">
                                  {issue.touch_files.length} touch files
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Issue Specification Inspector */}
                  <div className="lg:col-span-5 border-2 border-black bg-surface-container-lowest p-space-md brutal-shadow-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-space-sm">
                        <span className="font-label-sm text-label-sm bg-black text-white px-2 py-0.5 uppercase">
                          ISSUE SPECIFICATION
                        </span>
                        <span className="font-label-sm text-label-sm text-primary font-bold">
                          {selectedIssue ? `ISSUE #${selectedIssue.number}` : "SELECT AN ISSUE"}
                        </span>
                      </div>

                      <h3 className="font-headline-md text-headline-sm font-bold uppercase mb-2">
                        {selectedIssue?.title || "Select an issue from the list"}
                      </h3>

                      <div className="p-3 border-2 border-black bg-secondary-container mb-space-sm font-label-sm text-label-sm">
                        <div className="font-bold uppercase text-black mb-1">// GEMMA SUITABILITY RATIONALE:</div>
                        <div className="text-on-surface-variant">
                          {selectedIssue?.rationale || "Isolated scope suitable for onboarding contributors."}
                        </div>
                      </div>

                      {selectedIssue?.touch_files && selectedIssue.touch_files.length > 0 && (
                        <div className="flex flex-col gap-space-xs font-label-sm text-label-sm mb-space-sm">
                          <strong>TARGET CODEBASE FILES:</strong>
                          <ul className="list-disc list-inside font-mono text-xs bg-surface-container p-2 border border-black space-y-1">
                            {selectedIssue.touch_files.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex flex-col gap-1 font-label-sm text-label-sm">
                        <span className="font-bold uppercase text-on-surface">AUTOMATED NEXT STEPS:</span>
                        <div className="space-y-1.5 text-on-surface-variant">
                          {(selectedIssue?.steps && selectedIssue.steps.length > 0
                            ? selectedIssue.steps
                            : [
                                `Clone repository and checkout a new branch fix/issue-${selectedIssue?.number || "42"}`,
                                "Locate target source files and verify existing test cases",
                                "Implement the proposed change and run the unit test harness",
                                "Submit pull request referencing the issue number",
                              ]
                          ).map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="bg-black text-white px-1.5 text-[10px] shrink-0 font-bold">
                                {idx + 1}
                              </span>
                              <span className="text-xs">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-space-md pt-space-sm border-t-2 border-black flex gap-2">
                      <a
                        href={selectedIssue?.html_url || `https://github.com/${analysis.full_name}/issues`}
                        target="_blank"
                        rel="noreferrer"
                        className="brutal-btn flex-1 py-2.5 bg-black text-primary-container border-2 border-black font-headline-sm text-label-md uppercase tracking-wide font-bold text-center flex items-center justify-center gap-1"
                      >
                        <span>VIEW ON GITHUB</span>
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </a>
                      <button
                        onClick={() => setActiveTab("path")}
                        className="brutal-btn px-4 py-2.5 bg-surface-container-lowest text-black border-2 border-black font-headline-sm text-label-md uppercase font-bold"
                      >
                        ROADMAP
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CONTRIBUTION PATH (ROADMAP) */}
              {activeTab === "path" && (
                <div className="border-2 border-black bg-surface-container-lowest p-space-lg brutal-shadow-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm pb-space-md border-b-2 border-black mb-space-md">
                    <div>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                        // DETERMINISTIC ROADMAP
                      </span>
                      <h3 className="font-headline-lg text-headline-lg uppercase font-bold text-on-surface">
                        5-STEP CONTRIBUTOR PIPELINE
                      </h3>
                    </div>
                    <div className="bg-primary-container px-3 py-1.5 border-2 border-black font-label-sm text-label-sm font-bold uppercase brutal-shadow-sm">
                      CURRENT REPO: {analysis.full_name}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-space-sm font-label-sm">
                    {analysis.roadmap.map((step, idx) => (
                      <div
                        key={step.step_number || idx}
                        className={`border-2 border-black p-space-sm flex flex-col justify-between ${
                          idx === 3 ? "bg-primary-container brutal-shadow-sm font-bold" : "bg-surface-container"
                        }`}
                      >
                        <div>
                          <div className="w-7 h-7 bg-black text-white flex items-center justify-center font-bold mb-2">
                            {step.step_number || `0${idx + 1}`}
                          </div>
                          <div className="font-headline-sm text-headline-sm uppercase font-bold mb-1">
                            {step.title}
                          </div>
                          <p className="text-xs text-on-surface-variant font-medium">
                            {step.description}
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-black text-[10px] uppercase font-bold text-black">
                          {step.status}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-space-md p-4 bg-black text-white border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                    <div>
                      <span className="text-primary-container font-bold">$ git clone </span>
                      <span>https://github.com/{analysis.full_name}.git</span>
                    </div>
                    <span className="text-secondary-fixed-dim uppercase text-[11px]">
                      DEFAULT BRANCH: {analysis.default_branch}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 5: ASK REPO TERMINAL (LIVE AI Q&A) */}
              {activeTab === "ask" && (
                <div className="border-2 border-black bg-[#171E19] text-white p-space-md brutal-shadow-lg">
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between border-b border-[#2b3530] pb-space-sm mb-space-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-error inline-block border border-black"></span>
                      <span className="w-3 h-3 bg-primary-container inline-block border border-black"></span>
                      <span className="w-3 h-3 bg-tertiary-fixed inline-block border border-black"></span>
                      <span className="font-label-sm text-label-sm text-tertiary-fixed ml-2 font-bold uppercase">
                        GROUNDED GEMMA 4 REPO SHELL // RUNNING
                      </span>
                    </div>
                    <div className="font-label-sm text-label-sm text-primary-container">
                      LIVE INFERENCE ENGINE READY
                    </div>
                  </div>

                  {/* Query Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAsk();
                    }}
                    className="bg-[#111613] border-2 border-[#2b3530] p-2 flex items-center gap-2 mb-space-sm"
                  >
                    <span className="text-primary-container font-mono font-bold">&gt;</span>
                    <input
                      className="w-full bg-transparent font-mono text-sm text-white outline-none placeholder:text-secondary"
                      value={terminalQuery}
                      onChange={(e) => setTerminalQuery(e.target.value)}
                      placeholder="Ask any architectural question about this codebase..."
                      type="text"
                    />
                    <button
                      type="submit"
                      disabled={terminalLoading}
                      className="px-4 py-1.5 bg-primary-container text-black font-headline-sm text-label-sm font-bold uppercase border border-black hover:bg-white disabled:opacity-50"
                    >
                      {terminalLoading ? "THINKING..." : "QUERY"}
                    </button>
                  </form>

                  {/* Query Suggestion Chips */}
                  <div className="flex flex-wrap items-center gap-2 font-label-sm text-label-sm mb-space-md">
                    <span className="text-secondary-fixed-dim uppercase">TRY ASKING:</span>
                    <button
                      onClick={() => {
                        const q = "Where are the primary entrypoints and routes defined?";
                        setTerminalQuery(q);
                        handleAsk(q);
                      }}
                      className="border border-[#2b3530] bg-[#1a221d] px-2 py-0.5 hover:text-primary-container"
                    >
                      Where are primary routes defined?
                    </button>
                    <button
                      onClick={() => {
                        const q = "How is testing configured and how do I run unit tests?";
                        setTerminalQuery(q);
                        handleAsk(q);
                      }}
                      className="border border-[#2b3530] bg-[#1a221d] px-2 py-0.5 hover:text-primary-container"
                    >
                      How do I run tests?
                    </button>
                    <button
                      onClick={() => {
                        const q = "What are the core dependencies and configuration patterns?";
                        setTerminalQuery(q);
                        handleAsk(q);
                      }}
                      className="border border-[#2b3530] bg-[#1a221d] px-2 py-0.5 hover:text-primary-container"
                    >
                      What are core dependencies?
                    </button>
                  </div>

                  {/* Terminal Error */}
                  {terminalError && (
                    <div className="p-3 bg-error text-white font-mono text-xs border border-white mb-3">
                      ERROR: {terminalError}
                    </div>
                  )}

                  {/* Terminal Output */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md border-t border-[#2b3530] pt-space-md">
                    {/* Explanation */}
                    <div className="md:col-span-7 flex flex-col gap-2">
                      <div className="font-label-sm text-label-sm text-primary-container uppercase font-bold">
                        // GEMMA 4 ARCHITECTURAL SYNTHESIS
                      </div>
                      <div className="font-body-md text-sm text-secondary-fixed font-normal leading-relaxed whitespace-pre-wrap">
                        {terminalLoading
                          ? "Executing query... Grounding evidence against repository tree and AST..."
                          : terminalResult
                          ? terminalResult.answer
                          : `Ask any question above to explore ${analysis.full_name} with direct citations.`}
                      </div>
                    </div>

                    {/* Citations */}
                    <div className="md:col-span-5 flex flex-col gap-2 bg-[#111613] border border-[#2b3530] p-3">
                      <div className="font-label-sm text-label-sm text-tertiary-fixed uppercase font-bold">
                        // RETRIEVED SOURCE CITATIONS
                      </div>
                      <div className="flex flex-col gap-2 font-mono text-xs text-secondary-fixed">
                        {terminalResult && terminalResult.citations.length > 0 ? (
                          terminalResult.citations.map((c, i) => (
                            <div key={i} className="p-2 border border-[#2b3530] bg-[#171e19]">
                              <div className="text-primary-container font-bold">{c.file}</div>
                              <div className="text-[11px] text-secondary-fixed-dim mt-0.5">{c.snippet}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-secondary-fixed-dim text-xs">
                            Citations and source references will appear here once a query is executed.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[#171E19] text-on-tertiary border-t-2 border-black mt-16">
        <div className="max-w-[1440px] mx-auto px-margin py-space-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter-lg items-start pb-space-xl border-b border-[#2B3530]">
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 bg-primary-container border-2 border-black flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-black font-bold">radar</span>
                </div>
                <span className="font-headline-sm text-headline-sm uppercase text-primary-container font-bold">
                  SPARK
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-secondary-fixed-dim leading-relaxed">
                Deterministic repository understanding, dynamic module graphs, and AI-grounded first-issue matching for
                open source contributors.
              </p>
            </div>
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-bold border-b border-[#2B3530] pb-2">
                NAVIGATION
              </span>
              <nav className="flex flex-col gap-2 font-body-sm text-body-sm">
                <button
                  onClick={() => { setActiveTab("arch"); workspaceRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                  className="text-left text-secondary-fixed-dim hover:text-primary-container transition-colors"
                >
                  Architectural Graphs
                </button>
                <button
                  onClick={() => { setActiveTab("contributors"); workspaceRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                  className="text-left text-secondary-fixed-dim hover:text-primary-container transition-colors"
                >
                  Contributor Networks
                </button>
                <button
                  onClick={() => { setActiveTab("issues"); workspaceRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                  className="text-left text-secondary-fixed-dim hover:text-primary-container transition-colors"
                >
                  Issue Suitability & Matching
                </button>
                <button
                  onClick={() => { setActiveTab("ask"); workspaceRef.current?.scrollIntoView({ behavior: "smooth" }); }}
                  className="text-left text-secondary-fixed-dim hover:text-primary-container transition-colors"
                >
                  Gemma AI Reasoning Shell
                </button>
              </nav>
            </div>
            <div className="flex flex-col gap-space-sm">
              <span className="font-label-md text-label-md uppercase tracking-wider text-primary-container font-bold border-b border-[#2B3530] pb-2">
                TECH STACK
              </span>
              <div className="grid grid-cols-2 gap-space-xs font-label-sm text-label-sm">
                <div className="border border-[#2B3530] bg-[#111613] p-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-container"></span>
                  <span>Gemma / Gemini</span>
                </div>
                <div className="border border-[#2B3530] bg-[#111613] p-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-container"></span>
                  <span>GitHub API</span>
                </div>
                <div className="border border-[#2B3530] bg-[#111613] p-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-container"></span>
                  <span>FastAPI Core</span>
                </div>
                <div className="border border-[#2B3530] bg-[#111613] p-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary-container"></span>
                  <span>Next.js 15 React</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-sm font-label-sm text-label-sm text-secondary-fixed-dim">
            <div>© 2026 SPARK. BUILT FOR OPEN SOURCE CONTRIBUTORS.</div>
            <div className="flex items-center gap-space-md uppercase">
              <span>APACHE 2.0 / MIT</span>
              <span>LIVE TELEMETRY</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
