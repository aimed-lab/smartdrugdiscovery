"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ── Types ────────────────────────────────────────────────────────────────────

type ModelStatus = "connected" | "available" | "local" | "not_installed";
type ModelProvider = "Anthropic" | "OpenAI" | "Google" | "Microsoft" | "Meta" | "UAB SysPAI" | "Mistral";

interface FoundationModel {
  id: string;
  name: string;
  version: string;
  provider: ModelProvider;
  status: ModelStatus;
  useCase: string[];
  contextK: number;
  inputPer1M: number | null;
  outputPer1M: number | null;
  latencyMs: number;
  uptime: number;
  hasKey: boolean;
  keyMasked?: string;
  description: string;
  safetyFiltered: boolean;
  domainTuned: boolean;
}

// ── Model catalogue ───────────────────────────────────────────────────────────

const models: FoundationModel[] = [
  {
    id: "claude-sonnet",
    name: "Claude Sonnet 4.5",
    version: "claude-sonnet-4-5",
    provider: "Anthropic",
    status: "connected",
    useCase: ["Drug design", "Literature", "Reasoning", "Code"],
    contextK: 200,
    inputPer1M: 3.0,
    outputPer1M: 15.0,
    latencyMs: 820,
    uptime: 99.9,
    hasKey: true,
    keyMasked: "sk-ant-•••••••••Kp2",
    description: "Best general-purpose model for drug discovery reasoning, literature synthesis, and code generation. Currently powering Design with AI.",
    safetyFiltered: true,
    domainTuned: false,
  },
  {
    id: "claude-opus",
    name: "Claude Opus 4",
    version: "claude-opus-4-0",
    provider: "Anthropic",
    status: "available",
    useCase: ["Complex reasoning", "Multi-step design", "Decision reports"],
    contextK: 200,
    inputPer1M: 15.0,
    outputPer1M: 75.0,
    latencyMs: 2100,
    uptime: 99.8,
    hasKey: true,
    keyMasked: "sk-ant-•••••••••Kp2",
    description: "Highest-capability Anthropic model. Recommended for decision reports, complex multi-step drug design workflows, and Go/No-Go analyses.",
    safetyFiltered: true,
    domainTuned: false,
  },
  {
    id: "gpt4o",
    name: "GPT-4o",
    version: "gpt-4o-2024-11-20",
    provider: "OpenAI",
    status: "available",
    useCase: ["Multimodal", "Structure analysis", "Literature"],
    contextK: 128,
    inputPer1M: 2.5,
    outputPer1M: 10.0,
    latencyMs: 950,
    uptime: 99.5,
    hasKey: false,
    description: "OpenAI flagship multimodal model. Useful for analyzing structure images, spectral data, and literature PDFs alongside text.",
    safetyFiltered: true,
    domainTuned: false,
  },
  {
    id: "gemini-pro",
    name: "Gemini 2.5 Pro",
    version: "gemini-2.5-pro",
    provider: "Google",
    status: "available",
    useCase: ["Long context", "Document analysis", "Clinical data"],
    contextK: 1000,
    inputPer1M: 1.25,
    outputPer1M: 5.0,
    latencyMs: 1100,
    uptime: 99.3,
    hasKey: false,
    description: "Google's 1M-token context model. Best for full clinical trial documents, EHR ingestion, and long-chain biomedical reasoning.",
    safetyFiltered: true,
    domainTuned: false,
  },
  {
    id: "drug-gpt",
    name: "Drug-GPT",
    version: "v1.2",
    provider: "UAB SysPAI",
    status: "not_installed",
    useCase: ["Molecule generation", "SMILES design", "ADMET prediction"],
    contextK: 32,
    inputPer1M: null,
    outputPer1M: null,
    latencyMs: 0,
    uptime: 0,
    hasKey: false,
    description: "Domain-fine-tuned model for molecular SMILES generation, scaffold hopping, and ADMET property prediction. Runs locally via Ollama.",
    safetyFiltered: true,
    domainTuned: true,
  },
  {
    id: "biogpt",
    name: "BioGPT",
    version: "microsoft/BioGPT-Large",
    provider: "Microsoft",
    status: "not_installed",
    useCase: ["Biomedical NLP", "Target extraction", "Literature QA"],
    contextK: 4,
    inputPer1M: null,
    outputPer1M: null,
    latencyMs: 0,
    uptime: 0,
    hasKey: false,
    description: "Pre-trained on PubMed. Best for entity extraction, relation classification, and biomedical QA. Runs locally.",
    safetyFiltered: false,
    domainTuned: true,
  },
  {
    id: "llama3",
    name: "Llama 3.3 70B",
    version: "llama3.3:70b",
    provider: "Meta",
    status: "local",
    useCase: ["General reasoning", "Privacy-sensitive data", "Offline"],
    contextK: 128,
    inputPer1M: null,
    outputPer1M: null,
    latencyMs: 3800,
    uptime: 100,
    hasKey: false,
    description: "Open-weight model running locally via Ollama. Use for privacy-sensitive patient data that must not leave your institution.",
    safetyFiltered: false,
    domainTuned: false,
  },
  {
    id: "mistral",
    name: "Mistral Large 2",
    version: "mistral-large-2411",
    provider: "Mistral",
    status: "available",
    useCase: ["Code generation", "Data analysis", "EU compliance"],
    contextK: 128,
    inputPer1M: 2.0,
    outputPer1M: 6.0,
    latencyMs: 730,
    uptime: 99.1,
    hasKey: false,
    description: "EU-hosted model. Recommended when GDPR / European data residency requirements apply to patient cohort analysis.",
    safetyFiltered: true,
    domainTuned: false,
  },
];

// ── Usage mock data ───────────────────────────────────────────────────────────

const usageMock = [
  { model: "Claude Sonnet 4.5", inputM: 1.24, outputM: 0.31, calls: 418, costUSD: 8.37 },
  { model: "Claude Opus 4",     inputM: 0.08, outputM: 0.02, calls: 12,  costUSD: 2.70 },
  { model: "Llama 3.3 70B",    inputM: 0.42, outputM: 0.11, calls: 67,  costUSD: 0.00 },
];
const totalCost = usageMock.reduce((s, r) => s + r.costUSD, 0);

// ── Config maps ───────────────────────────────────────────────────────────────

const providerBadge: Record<ModelProvider, string> = {
  Anthropic:    "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  OpenAI:       "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Google:       "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Microsoft:    "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  Meta:         "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  "UAB SysPAI": "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Mistral:      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
};

const statusConfig: Record<ModelStatus, { dot: string; label: string; text: string }> = {
  connected:     { dot: "bg-green-500 animate-pulse", label: "Connected",      text: "text-green-600 dark:text-green-400" },
  available:     { dot: "bg-yellow-400",              label: "Available",       text: "text-yellow-600 dark:text-yellow-400" },
  local:         { dot: "bg-blue-500",                label: "Local (Ollama)",  text: "text-blue-600 dark:text-blue-400" },
  not_installed: { dot: "bg-gray-300",                label: "Not installed",   text: "text-muted-foreground" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ModelsPage() {
  const [activeFilter, setActiveFilter] = useState<ModelStatus | "all">("all");
  const [keyModal, setKeyModal]         = useState<{ modelId: string; name: string; currentKey: string } | null>(null);
  const [keyInput, setKeyInput]         = useState("");
  const [keyVisible, setKeyVisible]     = useState(false);
  const [costCap, setCostCap]           = useState("50");
  const [capEnabled, setCapEnabled]     = useState(true);
  const [activeModelId, setActiveModelId] = useState("claude-sonnet");

  const filtered = models.filter((m) => activeFilter === "all" || m.status === activeFilter);

  const counts = {
    connected:     models.filter((m) => m.status === "connected").length,
    available:     models.filter((m) => m.status === "available").length,
    local:         models.filter((m) => m.status === "local").length,
    not_installed: models.filter((m) => m.status === "not_installed").length,
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Foundation Models</h1>
        <p className="text-muted-foreground mt-1">
          Select, connect, and manage AI models — API keys, usage tracking, cost caps, and safety settings
        </p>
      </div>

      {/* Status summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["connected", "available", "local", "not_installed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveFilter(activeFilter === s ? "all" : s)}
            className={cn(
              "rounded-xl border bg-card p-4 text-left transition-all hover:shadow-sm",
              activeFilter === s && "ring-2 ring-primary"
            )}
          >
            <p className={cn("text-2xl font-bold", statusConfig[s].text)}>{counts[s]}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{statusConfig[s].label}</p>
          </button>
        ))}
      </div>

      {/* Active model banner */}
      <div className="flex items-center gap-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
        <p className="text-sm">
          <span className="font-medium text-green-800 dark:text-green-300">Active model: </span>
          <span className="text-green-700 dark:text-green-400">
            {models.find((m) => m.id === activeModelId)?.name ?? "—"}
          </span>
          <span className="text-green-600 dark:text-green-500 text-xs ml-2">
            — used by Design with AI · AI Chat
          </span>
        </p>
        <p className="ml-auto text-xs text-orange-600 dark:text-orange-400 font-medium">
          ⚠ Chat is currently a mock — add ANTHROPIC_API_KEY in Settings to enable live completions
        </p>
      </div>

      <Tabs defaultValue="catalogue">
        <TabsList>
          <TabsTrigger value="catalogue">Model Catalogue</TabsTrigger>
          <TabsTrigger value="keys">API Keys</TabsTrigger>
          <TabsTrigger value="usage">Usage &amp; Costs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* ── Catalogue ──────────────────────────────────────────── */}
        <TabsContent value="catalogue" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["all", "connected", "available", "local", "not_installed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  activeFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >
                {f === "all" ? "All models" : f === "not_installed" ? "Not installed" : statusConfig[f].label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((model) => {
              const sc = statusConfig[model.status];
              return (
                <Card key={model.id} className={cn(model.status === "connected" && "border-green-200 dark:border-green-800")}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{model.name}</CardTitle>
                        <CardDescription className="font-mono text-[10px] mt-0.5">{model.version}</CardDescription>
                      </div>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0", providerBadge[model.provider])}>
                        {model.provider}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", sc.dot)} />
                      <span className={cn("text-xs font-medium", sc.text)}>{sc.label}</span>
                      {model.safetyFiltered && (
                        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Safety filtered</span>
                      )}
                      {model.domainTuned && (
                        <span className="rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 px-2 py-0.5 text-[10px]">Domain-tuned</span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">{model.description}</p>

                    <div className="flex flex-wrap gap-1">
                      {model.useCase.map((u) => (
                        <span key={u} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{u}</span>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="rounded-lg bg-muted/60 py-1.5">
                        <p className="text-[10px] text-muted-foreground">Context</p>
                        <p className="text-xs font-semibold">{model.contextK}K</p>
                      </div>
                      <div className="rounded-lg bg-muted/60 py-1.5">
                        <p className="text-[10px] text-muted-foreground">Input/1M</p>
                        <p className="text-xs font-semibold">{model.inputPer1M !== null ? `$${model.inputPer1M.toFixed(2)}` : "Free"}</p>
                      </div>
                      <div className="rounded-lg bg-muted/60 py-1.5">
                        <p className="text-[10px] text-muted-foreground">Output/1M</p>
                        <p className="text-xs font-semibold">{model.outputPer1M !== null ? `$${model.outputPer1M.toFixed(2)}` : "Free"}</p>
                      </div>
                    </div>

                    {model.uptime > 0 && (
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span>30-day uptime · {model.latencyMs > 0 ? `avg ${model.latencyMs}ms` : "—"}</span>
                          <span>{model.uptime}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", model.uptime > 99 ? "bg-green-500" : "bg-yellow-400")}
                            style={{ width: `${model.uptime}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="pt-1">
                      {model.status === "connected" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setActiveModelId(model.id)}
                            className={cn(
                              "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                              activeModelId === model.id
                                ? "bg-green-600 text-white"
                                : "border border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                            )}
                          >
                            {activeModelId === model.id ? "✓ Active in Chat" : "Set as Active"}
                          </button>
                          <button
                            onClick={() => { setKeyModal({ modelId: model.id, name: model.name, currentKey: model.keyMasked ?? "" }); setKeyInput(""); setKeyVisible(false); }}
                            className="rounded-md border px-3 py-2 text-xs hover:bg-muted transition-colors"
                            title="Rotate API key"
                          >
                            🔑
                          </button>
                        </div>
                      )}
                      {model.status === "available" && (
                        <button
                          onClick={() => { setKeyModal({ modelId: model.id, name: model.name, currentKey: "" }); setKeyInput(""); setKeyVisible(false); }}
                          className="w-full rounded-md bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                          Add API Key to Connect
                        </button>
                      )}
                      {model.status === "local" && (
                        <div className="flex items-center justify-between rounded-md border px-3 py-2 text-xs">
                          <span className="text-blue-600 font-medium">Running via Ollama</span>
                          <button className="text-muted-foreground hover:text-destructive transition-colors text-xs">Uninstall</button>
                        </div>
                      )}
                      {model.status === "not_installed" && (
                        <button className="w-full rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors">
                          Install Locally (Ollama)
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── API Keys ───────────────────────────────────────────── */}
        <TabsContent value="keys" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>Keys are saved to server environment variables and never stored in the browser. Rotate regularly.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground text-left">
                      <th className="pb-2 pr-4 font-medium">Model</th>
                      <th className="pb-2 pr-4 font-medium">Provider</th>
                      <th className="pb-2 pr-4 font-medium">Key</th>
                      <th className="pb-2 pr-4 font-medium">Status</th>
                      <th className="pb-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {models.map((m) => (
                      <tr key={m.id}>
                        <td className="py-2.5 pr-4 font-medium">{m.name}</td>
                        <td className="py-2.5 pr-4">
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", providerBadge[m.provider])}>
                            {m.provider}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">
                          {m.hasKey ? m.keyMasked : m.inputPer1M === null ? "Not required" : "—"}
                        </td>
                        <td className="py-2.5 pr-4">
                          {m.hasKey ? (
                            <span className="text-green-600 text-xs font-medium">✓ Set</span>
                          ) : m.inputPer1M === null ? (
                            <span className="text-blue-600 text-xs">Local / free</span>
                          ) : (
                            <span className="text-orange-500 text-xs">Missing</span>
                          )}
                        </td>
                        <td className="py-2.5">
                          <div className="flex gap-2">
                            {m.inputPer1M !== null && (
                              <button
                                onClick={() => { setKeyModal({ modelId: m.id, name: m.name, currentKey: m.keyMasked ?? "" }); setKeyInput(""); setKeyVisible(false); }}
                                className="rounded-md border px-2.5 py-1 text-xs hover:bg-muted transition-colors"
                              >
                                {m.hasKey ? "Rotate" : "Add key"}
                              </button>
                            )}
                            {m.hasKey && (
                              <button className="rounded-md border border-red-200 text-red-600 px-2.5 py-1 text-xs hover:bg-red-50 transition-colors">
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Usage & Costs ──────────────────────────────────────── */}
        <TabsContent value="usage" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total cost (Mar)",  val: `$${totalCost.toFixed(2)}` },
              { label: "Total API calls",   val: `${usageMock.reduce((s,r)=>s+r.calls,0)}` },
              { label: "Input (M tokens)",  val: usageMock.reduce((s,r)=>s+r.inputM,0).toFixed(2) },
              { label: "Output (M tokens)", val: usageMock.reduce((s,r)=>s+r.outputM,0).toFixed(2) },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-xl border bg-card p-4">
                <p className="text-2xl font-bold">{val}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Per-model breakdown — March 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground text-left">
                    <th className="pb-2 pr-4 font-medium">Model</th>
                    <th className="pb-2 pr-4 font-medium">Calls</th>
                    <th className="pb-2 pr-4 font-medium">Input (M)</th>
                    <th className="pb-2 pr-4 font-medium">Output (M)</th>
                    <th className="pb-2 font-medium">Cost (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usageMock.map((row) => (
                    <tr key={row.model}>
                      <td className="py-2.5 pr-4 font-medium">{row.model}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{row.calls}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs">{row.inputM.toFixed(2)}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs">{row.outputM.toFixed(2)}</td>
                      <td className="py-2.5 font-semibold">${row.costUSD.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="border-t font-semibold">
                    <td className="py-2.5 pr-4">Total</td>
                    <td className="py-2.5 pr-4">{usageMock.reduce((s,r)=>s+r.calls,0)}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{usageMock.reduce((s,r)=>s+r.inputM,0).toFixed(2)}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{usageMock.reduce((s,r)=>s+r.outputM,0).toFixed(2)}</td>
                    <td className="py-2.5">${totalCost.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cost distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {usageMock.map((row) => (
                <div key={row.model} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span>{row.model}</span>
                    <span className="font-medium">${row.costUSD.toFixed(2)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${totalCost > 0 ? (row.costUSD / totalCost) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Settings ───────────────────────────────────────────── */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          {/* Default model selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Default Chat Model</CardTitle>
              <CardDescription>
                Used by Design with AI → AI Chat. Currently the chat sends mock responses.
                To enable live completions, add the ANTHROPIC_API_KEY to Vercel environment variables.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                value={activeModelId}
                onChange={(e) => setActiveModelId(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm w-full sm:w-72"
              >
                {models.filter((m) => m.status === "connected" || m.status === "local").map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — {m.provider}</option>
                ))}
              </select>
              <div className="rounded-md border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-3 text-xs text-orange-700 dark:text-orange-400 space-y-1">
                <p className="font-semibold">How to enable live AI Chat:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Go to Vercel → Project → Settings → Environment Variables</li>
                  <li>Add <span className="font-mono">ANTHROPIC_API_KEY</span> = your Claude API key</li>
                  <li>Redeploy the project</li>
                  <li>The AI Chat will then call Claude in real-time instead of returning a placeholder</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Cost cap */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Cost Cap</CardTitle>
              <CardDescription>Hard limit on API spend per calendar month. Requests are blocked once reached.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={capEnabled} onChange={(e) => setCapEnabled(e.target.checked)} className="rounded" />
                Enable monthly cap
              </label>
              {capEnabled && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <input
                    type="number" min="1" max="10000" value={costCap}
                    onChange={(e) => setCostCap(e.target.value)}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm w-32"
                  />
                  <span className="text-sm text-muted-foreground">USD / month</span>
                </div>
              )}
              <div className={cn(
                "rounded-md p-3 text-xs",
                parseFloat(costCap) > 0 && totalCost / parseFloat(costCap) > 0.8
                  ? "bg-orange-50 border border-orange-200 text-orange-700"
                  : "bg-muted text-muted-foreground"
              )}>
                Current spend: <span className="font-semibold">${totalCost.toFixed(2)}</span> of ${costCap || "—"} cap
                {costCap && ` (${((totalCost / parseFloat(costCap)) * 100).toFixed(0)}% used)`}
              </div>
            </CardContent>
          </Card>

          {/* Safety guardrails */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Safety &amp; Compliance Guardrails</CardTitle>
              <CardDescription>Platform-level controls applied to all model interactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Block controlled-substance synthesis routes",    enabled: true,  locked: true },
                { label: "Redact PHI before sending to remote APIs",       enabled: true,  locked: false },
                { label: "Log all model queries for audit trail",           enabled: true,  locked: false },
                { label: "Require drug-discovery domain-relevance filter", enabled: false, locked: false },
              ].map(({ label, enabled, locked }) => (
                <div key={label} className="flex items-center justify-between rounded-md border px-3 py-2.5 gap-3">
                  <span className="text-sm flex-1">{label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {locked && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Platform lock</span>}
                    <div className={cn(
                      "relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0",
                      enabled ? "bg-green-500" : "bg-muted-foreground/30",
                      locked && "opacity-60 cursor-not-allowed"
                    )}>
                      <span className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white shadow mt-0.5 transition-transform",
                        enabled ? "translate-x-4" : "translate-x-0.5"
                      )} />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* API Key modal */}
      {keyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card border rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-semibold">
              {keyModal.currentKey ? "Rotate" : "Add"} API Key — {keyModal.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              Your key is saved as a server environment variable and never stored in the browser or logs.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-medium">API Key</label>
              <div className="flex gap-2">
                <input
                  type={keyVisible ? "text" : "password"}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="sk-ant-… or sk-… or AIza…"
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button onClick={() => setKeyVisible(!keyVisible)} className="rounded-md border px-3 py-2 text-xs hover:bg-muted transition-colors">
                  {keyVisible ? "Hide" : "Show"}
                </button>
              </div>
              {keyModal.currentKey && (
                <p className="text-[10px] text-muted-foreground">Current: <span className="font-mono">{keyModal.currentKey}</span></p>
              )}
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button onClick={() => setKeyModal(null)} className="rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                disabled={!keyInput.trim()}
                onClick={() => setKeyModal(null)}
                className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
