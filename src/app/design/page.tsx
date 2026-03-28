"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ── Types ───────────────────────────────────────────────────────────────────

type Phase = "design" | "make" | "build" | "test";

interface DMBTEntry {
  id: string;
  compound: string;
  phase: Phase;
  task: string;
  status: "planned" | "active" | "completed" | "failed";
  assignee: string;
  date: string;
  result: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// ── Phase metadata ──────────────────────────────────────────────────────────

const phases: {
  key: Phase;
  label: string;
  color: string;
  ring: string;
  bg: string;
  text: string;
  description: string;
}[] = [
  {
    key: "design",
    label: "Design",
    color: "bg-blue-500",
    ring: "ring-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-300",
    description: "Computational design, virtual screening, molecular generation",
  },
  {
    key: "make",
    label: "Make",
    color: "bg-green-500",
    ring: "ring-green-500",
    bg: "bg-green-50 dark:bg-green-950",
    text: "text-green-700 dark:text-green-300",
    description: "Synthesis planning, route optimization, reaction prediction",
  },
  {
    key: "build",
    label: "Build",
    color: "bg-orange-500",
    ring: "ring-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950",
    text: "text-orange-700 dark:text-orange-300",
    description: "Compound assembly, library production, formulation",
  },
  {
    key: "test",
    label: "Test",
    color: "bg-purple-500",
    ring: "ring-purple-500",
    bg: "bg-purple-50 dark:bg-purple-950",
    text: "text-purple-700 dark:text-purple-300",
    description: "Assay execution, ADMET profiling, in vivo studies",
  },
];

// ── Mock DMBT entries ───────────────────────────────────────────────────────

const dmbtEntries: DMBTEntry[] = [
  // Design
  { id: "1", compound: "SDD-0012", phase: "design", task: "Virtual screening hit", status: "completed", assignee: "Dr. Raj Patel", date: "Mar 10", result: "IC50 pred: 12 nM" },
  { id: "2", compound: "SDD-0089", phase: "design", task: "Scaffold hopping candidates", status: "active", assignee: "Drug-GPT", date: "Mar 20", result: "3 candidates generated" },
  { id: "3", compound: "SDD-0102", phase: "design", task: "ADMET prediction", status: "planned", assignee: "BioGPT", date: "Mar 25", result: "\u2014" },
  // Make
  { id: "4", compound: "SDD-0012", phase: "make", task: "Retrosynthesis analysis", status: "completed", assignee: "Dr. Elena Vasquez", date: "Mar 12", result: "4-step route identified" },
  { id: "5", compound: "SDD-0089", phase: "make", task: "Synthetic feasibility check", status: "active", assignee: "Dr. Maria Rodriguez", date: "Mar 22", result: "Route optimization" },
  { id: "6", compound: "SDD-0102", phase: "make", task: "Reagent procurement", status: "planned", assignee: "Dr. Wei Zhang", date: "Mar 28", result: "\u2014" },
  // Build
  { id: "7", compound: "SDD-0012", phase: "build", task: "Compound synthesis", status: "completed", assignee: "Dr. Elena Vasquez", date: "Mar 18", result: "98% purity, 45mg" },
  { id: "8", compound: "SDD-0089", phase: "build", task: "Library enumeration", status: "active", assignee: "Synthesis Bot", date: "Mar 24", result: "12/24 compounds" },
  { id: "9", compound: "SDD-0102", phase: "build", task: "Scale-up preparation", status: "planned", assignee: "Lab Automation", date: "Apr 1", result: "\u2014" },
  // Test
  { id: "10", compound: "SDD-0012", phase: "test", task: "Kinase selectivity panel", status: "completed", assignee: "Dr. Sarah Chen", date: "Mar 20", result: ">100x selective" },
  { id: "11", compound: "SDD-0089", phase: "test", task: "Primary biochemical assay", status: "active", assignee: "Assay Bot", date: "Mar 25", result: "Awaiting results" },
  { id: "12", compound: "SDD-0012", phase: "test", task: "In vivo PK study", status: "planned", assignee: "Dr. Amanda Foster", date: "Apr 5", result: "\u2014" },
];

// ── ChEMBL live data (fetched 2026-03-28 via MCP) ──────────────────────────

const chemblData = {
  target: {
    chembl_id: "CHEMBL5145",
    name: "Serine/threonine-protein kinase B-raf",
    gene: "BRAF",
    organism: "Homo sapiens",
    uniprot: "P15056",
    pdb_structures: 100,
    go_terms: ["MAPK cascade", "protein phosphorylation", "ERK1/ERK2 cascade"],
  },
  approvedDrugs: [
    {
      name: "Vemurafenib (Zelboraf)",
      chembl_id: "CHEMBL1229517",
      approved: 2011,
      moa: "BRAF V600E inhibitor (direct, disease-efficacy confirmed)",
      mw: 489.93,
      alogp: 5.54,
      psa: 91.92,
      hba: 4,
      hbd: 2,
      ro5_violations: 1,
      qed: 0.33,
      usan_stem: "-rafenib",
    },
    {
      name: "Dabrafenib (Tafinlar)",
      chembl_id: "CHEMBL2028663",
      approved: 2013,
      moa: "BRAF V600E inhibitor (orphan designation)",
      mw: 519.57,
      alogp: 5.36,
      psa: 110.86,
      hba: 7,
      hbd: 2,
      ro5_violations: 2,
      qed: 0.37,
      usan_stem: "-rafenib",
    },
  ],
  topHits: [
    { chembl_id: "CHEMBL248256", ic50_nM: 5, pchembl: 8.3, le: 0.35, journal: "Bioorg Med Chem Lett 2007" },
    { chembl_id: "CHEMBL200889", ic50_nM: 6, pchembl: 8.22, le: 0.47, journal: "Bioorg Med Chem Lett 2006" },
    { chembl_id: "CHEMBL381250", ic50_nM: 6, pchembl: 8.22, le: 0.45, journal: "Bioorg Med Chem Lett 2006" },
    { chembl_id: "CHEMBL200320", ic50_nM: 8, pchembl: 8.10, le: 0.41, journal: "Bioorg Med Chem Lett 2006" },
  ],
};

// ── Initial chat messages ───────────────────────────────────────────────────

const initialMessages: Message[] = [
  {
    id: "msg-1",
    role: "user",
    content: "Design a selective BRAF V600E inhibitor with improved metabolic stability compared to Vemurafenib",
    timestamp: "2:30 PM",
  },
  {
    id: "msg-2",
    role: "assistant",
    content: `Based on the DMBT framework, here's my design proposal:

**Design Phase:**
\u2022 Scaffold: 7-azaindole core (replaces sulfonamide)
\u2022 Key modifications: 3-fluoropyridine at C5, cyclopropyl at N1
\u2022 Predicted IC50: 8 nM (BRAF V600E)
\u2022 Predicted selectivity: >50x over BRAF WT

**Make Phase (recommended route):**
\u2022 4-step synthesis from commercial 7-azaindole
\u2022 Key step: Suzuki coupling at C5
\u2022 Estimated timeline: 2 weeks

**Build Phase:**
\u2022 Priority: Synthesize 3 analogs varying C5 substituent
\u2022 Library size: 12 compounds (R-group enumeration)

**Test Phase:**
\u2022 Primary: BRAF V600E biochemical assay
\u2022 Secondary: Cell viability (A375 melanoma)
\u2022 ADMET: Microsomal stability, CYP panel

Shall I proceed with detailed retrosynthesis analysis?`,
    timestamp: "2:31 PM",
  },
];

// ── Status badge helper ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DMBTEntry["status"] }) {
  const styles: Record<string, string> = {
    planned: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    active: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", styles[status])}>
      {status}
    </span>
  );
}

// ── Page component ──────────────────────────────────────────────────────────

export default function DesignPage() {
  const [activePhase, setActivePhase] = useState<Phase | null>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState("Drug-GPT");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content:
          "I'm analyzing your query using the DMBT framework. In production, this would connect to the selected AI model for real-time design assistance across the Design-Make-Build-Test cycle.",
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredEntries = activePhase
    ? dmbtEntries.filter((e) => e.phase === activePhase)
    : dmbtEntries;

  // Position helpers for the flywheel (top, right, bottom, left)
  const phasePositions: Record<Phase, string> = {
    design: "top-0 left-1/2 -translate-x-1/2",
    make: "top-1/2 right-0 -translate-y-1/2",
    build: "bottom-0 left-1/2 -translate-x-1/2",
    test: "top-1/2 left-0 -translate-y-1/2",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Design with AI</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Design-Make-Build-Test cycle powered by AI foundation models
        </p>
      </div>

      {/* Main content — Tabs */}
      <Tabs defaultValue="dmbt" className="flex-1 flex flex-col">
        <div className="border-b px-6">
          <TabsList className="mt-2">
            <TabsTrigger value="dmbt">DMBT Cycle</TabsTrigger>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
            <TabsTrigger value="mcp" className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              MCP Intelligence
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── DMBT Cycle Tab ───────────────────────────────────────────── */}
        <TabsContent value="dmbt" className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Phase selector — 4-card grid replacing the flywheel */}
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {phases.map((phase) => (
                <button
                  key={phase.key}
                  onClick={() => setActivePhase(activePhase === phase.key ? null : phase.key)}
                  className={cn(
                    "rounded-lg border bg-card p-4 text-left transition-all hover:shadow-md cursor-pointer",
                    activePhase === phase.key ? `ring-2 ${phase.ring} shadow-sm` : "hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn("h-3 w-3 rounded-full shrink-0", phase.color)} />
                    <span className="font-semibold text-sm">{phase.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{phase.description}</p>
                </button>
              ))}
            </div>
            {activePhase && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Filtered by:</span>
                <span className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium",
                  phases.find((p) => p.key === activePhase)?.bg,
                  phases.find((p) => p.key === activePhase)?.text
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", phases.find((p) => p.key === activePhase)?.color)} />
                  {activePhase.charAt(0).toUpperCase() + activePhase.slice(1)} phase
                </span>
                <button
                  onClick={() => setActivePhase(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  × Clear filter
                </button>
              </div>
            )}
          </div>

          {/* DMBT Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {activePhase
                  ? `${activePhase.charAt(0).toUpperCase() + activePhase.slice(1)} Phase Entries`
                  : "All DMBT Entries"}
              </CardTitle>
              <CardDescription>
                {activePhase
                  ? `Showing ${filteredEntries.length} entries for the ${activePhase} phase`
                  : `Showing all ${filteredEntries.length} entries across the cycle`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Compound</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Task</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Status</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Assignee</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Date</th>
                      <th className="pb-2 font-medium text-muted-foreground">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => {
                      const phaseInfo = phases.find((p) => p.key === entry.phase);
                      return (
                        <tr key={entry.id} className="border-b last:border-0">
                          <td className="py-2.5 pr-4 font-mono text-xs">{entry.compound}</td>
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              {!activePhase && phaseInfo && (
                                <span className={cn("h-2 w-2 rounded-full", phaseInfo.color)} />
                              )}
                              {entry.task}
                            </div>
                          </td>
                          <td className="py-2.5 pr-4">
                            <StatusBadge status={entry.status} />
                          </td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{entry.assignee}</td>
                          <td className="py-2.5 pr-4 text-muted-foreground">{entry.date}</td>
                          <td className="py-2.5 text-muted-foreground">{entry.result}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── AI Chat Tab ──────────────────────────────────────────────── */}
        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
          {/* Model selector bar */}
          <div className="border-b p-3 flex items-center gap-3">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            >
              <option>Drug-GPT</option>
              <option>MolBERT</option>
              <option>BioGPT</option>
              <option>GPT-4</option>
              <option>Claude</option>
            </select>
            <span className="text-xs text-muted-foreground">
              DMBT-aware design assistant
            </span>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) =>
              message.role === "user" ? (
                <div key={message.id} className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3 max-w-[70%]">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex justify-start">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      {selectedModel}
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 max-w-[70%] whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                </div>
              )
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t p-4">
            <div className="flex items-end">
              <textarea
                className="flex-1 rounded-lg border border-input bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                rows={2}
                placeholder="Ask about drug design, synthesis routes, or the DMBT cycle..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                className="rounded-lg bg-primary text-primary-foreground px-4 py-3 hover:bg-primary/90 disabled:opacity-50 ml-2"
                disabled={!inputValue.trim()}
                onClick={handleSend}
              >
                Send
              </button>
            </div>
          </div>
        </TabsContent>
        {/* ── MCP Intelligence Tab ─────────────────────────────────── */}
        <TabsContent value="mcp" className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Header banner */}
          <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4 flex items-start gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                ChEMBL MCP Server — Live (6 tools connected)
              </p>
              <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                Data retrieved live on 2026-03-28 · Target: BRAF V600E / Melanoma · ChEMBL 34
              </p>
            </div>
          </div>

          {/* Query context */}
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
            <span className="font-medium">Query:</span>
            <span className="text-muted-foreground ml-2 italic">
              "Design a selective BRAF V600E inhibitor with improved metabolic stability compared to Vemurafenib"
            </span>
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* WITHOUT MCP */}
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-400" />
                  Without MCP
                </CardTitle>
                <CardDescription>AI relies on training-time knowledge only — no live database access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-md bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900 p-3 space-y-2 text-muted-foreground">
                  <p>BRAF V600E is a common oncogenic mutation in melanoma. Vemurafenib (PLX4032) is an approved RAF inhibitor targeting this mutant.</p>
                  <p>For improved metabolic stability you might consider reducing the sulfonamide, replacing the halogenated aryl, or modifying the heterocyclic core. Predicted IC50 values are not available without database access.</p>
                  <p className="italic text-xs">Known similar drugs: dabrafenib (Tafinlar), encorafenib (Braftovi). No current potency data available.</p>
                </div>
                <div className="rounded-md border p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gaps</p>
                  {[
                    "No verified IC50 / pChEMBL values",
                    "No ADMET property data",
                    "No scaffold comparison vs. approved drugs",
                    "No ligand-efficiency metrics",
                    "No literature provenance / assay refs",
                  ].map((gap) => (
                    <div key={gap} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="text-orange-500 mt-0.5">✗</span>
                      {gap}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* WITH MCP */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  With ChEMBL MCP
                </CardTitle>
                <CardDescription>Live queries to ChEMBL 34 — verified, citable data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">

                {/* Target */}
                <div className="rounded-md border p-3 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                    target_search(BRAF, Homo sapiens)
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
                    <span><span className="text-muted-foreground">ID:</span> <span className="font-mono">{chemblData.target.chembl_id}</span></span>
                    <span><span className="text-muted-foreground">UniProt:</span> <span className="font-mono">{chemblData.target.uniprot}</span></span>
                    <span><span className="text-muted-foreground">PDB structures:</span> {chemblData.target.pdb_structures}+</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {chemblData.target.go_terms.map((t) => (
                      <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{t}</span>
                    ))}
                  </div>
                </div>

                {/* Top bioactivity hits */}
                <div className="rounded-md border p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    get_bioactivity(CHEMBL5145, IC50, pChEMBL ≥ 8)
                  </p>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-1 pr-2 font-medium">ChEMBL ID</th>
                        <th className="pb-1 pr-2 font-medium">IC50 (nM)</th>
                        <th className="pb-1 pr-2 font-medium">pChEMBL</th>
                        <th className="pb-1 font-medium">LE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chemblData.topHits.map((h) => (
                        <tr key={h.chembl_id} className="border-b last:border-0">
                          <td className="py-1 pr-2 font-mono text-[10px] text-muted-foreground">{h.chembl_id}</td>
                          <td className={cn("py-1 pr-2 font-medium", h.ic50_nM <= 6 ? "text-green-600" : "text-yellow-600")}>
                            {h.ic50_nM}
                          </td>
                          <td className="py-1 pr-2">{h.pchembl}</td>
                          <td className="py-1">{h.le}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-[10px] text-muted-foreground mt-1.5">Total BRAF bioactivity records in ChEMBL: 3,993+</p>
                </div>

                {/* Approved drugs ADMET */}
                <div className="rounded-md border p-3 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    compound_search + get_admet — approved -rafenibs
                  </p>
                  {chemblData.approvedDrugs.map((drug) => (
                    <div key={drug.chembl_id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs">{drug.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{drug.chembl_id}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{drug.moa}</p>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { label: "MW", val: drug.mw.toFixed(0) },
                          { label: "ALogP", val: drug.alogp.toFixed(2) },
                          { label: "PSA", val: drug.psa.toFixed(0) + " Å²" },
                          { label: "QED", val: drug.qed.toFixed(2) },
                        ].map(({ label, val }) => (
                          <div key={label} className="rounded bg-muted p-1.5 text-center">
                            <p className="text-[9px] text-muted-foreground uppercase">{label}</p>
                            <p className="text-xs font-semibold">{val}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px]">
                        <span className={cn("font-medium", drug.ro5_violations === 0 ? "text-green-600" : "text-orange-500")}>
                          Ro5 violations: {drug.ro5_violations}
                        </span>
                        <span className="text-muted-foreground ml-2">Approved {drug.approved} · USAN: {drug.usan_stem}</span>
                      </p>
                    </div>
                  ))}
                </div>

                {/* Design insight */}
                <div className="rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-green-800 dark:text-green-300">MCP-derived Design Insight</p>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Vemurafenib: ALogP 5.54 (Ro5 borderline), QED 0.33 — metabolic liability likely from high lipophilicity.
                    Target property profile: ALogP ≤ 4.5, PSA 80–100 Å², MW &lt; 480, QED &gt; 0.45.
                    Best scaffold class: imidazopyridine/azaindole cores (LE ≥ 0.45 observed in top hits).
                  </p>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Tool call log */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">MCP Tool Call Log — this session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 font-mono text-xs">
                {[
                  { tool: "target_search", args: 'gene_symbol="BRAF", organism="Homo sapiens"', result: "CHEMBL5145 · 1 target · 100+ PDB" },
                  { tool: "compound_search", args: 'name="vemurafenib", max_phase=4', result: "CHEMBL1229517 · MW 489.93 · ALogP 5.54" },
                  { tool: "compound_search", args: 'name="dabrafenib", max_phase=4', result: "CHEMBL2028663 · MW 519.57 · ALogP 5.36" },
                  { tool: "get_bioactivity", args: "target=CHEMBL5145, IC50, pChEMBL≥8", result: "6 hits shown · 3,993 total" },
                  { tool: "get_mechanism", args: "molecule=CHEMBL1229517", result: "INHIBITOR · V600E specific · FDA 2011" },
                  { tool: "get_admet", args: "molecule=CHEMBL1229517", result: "Ro5 violations=1 · QED=0.33 · PSA=91.92" },
                ].map((call, i) => (
                  <div key={i} className="flex items-start gap-2 rounded bg-muted/50 px-3 py-1.5">
                    <span className="text-green-600 shrink-0">✓</span>
                    <span className="text-primary font-semibold shrink-0">{call.tool}</span>
                    <span className="text-muted-foreground truncate">({call.args})</span>
                    <span className="ml-auto text-muted-foreground shrink-0 hidden sm:block">→ {call.result}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </TabsContent>

      </Tabs>
    </div>
  );
}
