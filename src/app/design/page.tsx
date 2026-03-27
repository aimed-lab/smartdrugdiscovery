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
          </TabsList>
        </div>

        {/* ── DMBT Cycle Tab ───────────────────────────────────────────── */}
        <TabsContent value="dmbt" className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Flywheel */}
          <div className="flex justify-center">
            <div className="relative h-80 w-80">
              {/* Circular connector */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 320 320"
              >
                <circle
                  cx="160"
                  cy="160"
                  r="90"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="8 6"
                  className="text-muted-foreground/30"
                />
                {/* Arrows */}
                <path d="M205,72 L210,80 L200,78" fill="currentColor" className="text-muted-foreground/50" />
                <path d="M248,205 L240,210 L242,200" fill="currentColor" className="text-muted-foreground/50" />
                <path d="M115,248 L110,240 L120,242" fill="currentColor" className="text-muted-foreground/50" />
                <path d="M72,115 L80,110 L78,120" fill="currentColor" className="text-muted-foreground/50" />
              </svg>

              {/* Center label */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  {activePhase ? (
                    <>
                      <div className="font-semibold text-lg capitalize">{activePhase}</div>
                      <div className="text-xs text-muted-foreground max-w-[120px]">
                        {phases.find((p) => p.key === activePhase)?.description}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="font-semibold text-lg">DMBT</div>
                      <div className="text-xs text-muted-foreground">Click a phase</div>
                    </>
                  )}
                </div>
              </div>

              {/* Phase buttons */}
              {phases.map((phase) => (
                <button
                  key={phase.key}
                  onClick={() =>
                    setActivePhase(activePhase === phase.key ? null : phase.key)
                  }
                  className={cn(
                    "absolute w-36 rounded-lg border bg-card p-3 text-left transition-all hover:shadow-md cursor-pointer",
                    phasePositions[phase.key],
                    activePhase === phase.key && `ring-2 ${phase.ring}`
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full", phase.color)} />
                    <span className="font-medium text-sm">{phase.label}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                    {phase.description}
                  </p>
                </button>
              ))}
            </div>
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
      </Tabs>
    </div>
  );
}
