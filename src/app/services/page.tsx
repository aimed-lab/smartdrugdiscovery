"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface AIAgent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  creditsPerRun: number;
  status: "available" | "busy" | "maintenance";
  operatesOn: string[];
  category: "computational" | "experimental" | "clinical";
  successRate: number;
  avgRunTime: string;
}

interface HumanExpert {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  availability: "available" | "limited" | "unavailable";
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  operatesOn: string[];
  category: "computational" | "experimental" | "clinical";
  bio: string;
  initials: string;
}

const agents: AIAgent[] = [
  {
    id: "agent-001",
    name: "ADMET Prediction Agent",
    description:
      "Predicts ADMET profiles using ensemble ML models trained on ChEMBL data",
    capabilities: [
      "Lipinski Ro5 check",
      "CYP450 inhibition prediction",
      "hERG screening",
      "BBB permeability",
      "Hepatotoxicity scoring",
    ],
    creditsPerRun: 5,
    status: "available",
    operatesOn: ["compounds"],
    category: "computational",
    successRate: 94,
    avgRunTime: "~2 min",
  },
  {
    id: "agent-002",
    name: "Molecular Docking Agent",
    description:
      "Automated docking pipeline with flexible ligand/receptor prep and scoring",
    capabilities: [
      "AutoDock Vina",
      "Binding pose prediction",
      "Affinity estimation",
      "Interaction maps",
      "Ensemble docking",
    ],
    creditsPerRun: 15,
    status: "available",
    operatesOn: ["compounds", "targets"],
    category: "computational",
    successRate: 87,
    avgRunTime: "~15 min",
  },
  {
    id: "agent-003",
    name: "Literature Mining Agent",
    description:
      "Scans PubMed, bioRxiv, and patents for relevant findings",
    capabilities: [
      "PubMed search",
      "Patent analysis",
      "Competitor intelligence",
      "MoA extraction",
      "Citation networks",
    ],
    creditsPerRun: 8,
    status: "available",
    operatesOn: ["targets", "projects"],
    category: "computational",
    successRate: 91,
    avgRunTime: "~5 min",
  },
  {
    id: "agent-004",
    name: "Lead Optimization Agent",
    description:
      "Suggests structural modifications using generative chemistry models",
    capabilities: [
      "Scaffold hopping",
      "R-group enumeration",
      "Multi-parameter optimization",
      "MMP analysis",
      "Synthetic accessibility",
    ],
    creditsPerRun: 20,
    status: "busy",
    operatesOn: ["compounds", "experiments"],
    category: "computational",
    successRate: 82,
    avgRunTime: "~30 min",
  },
  {
    id: "agent-005",
    name: "Assay Design Agent",
    description:
      "Recommends optimal assay protocols based on target biology",
    capabilities: [
      "Protocol recommendation",
      "Control selection",
      "Dose-response design",
      "Power analysis",
      "Readout optimization",
    ],
    creditsPerRun: 10,
    status: "available",
    operatesOn: ["experiments", "targets"],
    category: "experimental",
    successRate: 89,
    avgRunTime: "~3 min",
  },
  {
    id: "agent-006",
    name: "Clinical Trial Feasibility Agent",
    description:
      "Analyzes trial feasibility based on populations and regulatory precedent",
    capabilities: [
      "Population estimation",
      "Regulatory pathways",
      "Competitor monitoring",
      "Endpoint recommendation",
      "Site selection",
    ],
    creditsPerRun: 25,
    status: "maintenance",
    operatesOn: ["projects"],
    category: "clinical",
    successRate: 78,
    avgRunTime: "~20 min",
  },
];

const experts: HumanExpert[] = [
  {
    id: "exp-001",
    name: "Dr. Elena Vasquez",
    title: "Medicinal Chemist",
    specialties: [
      "Kinase inhibitor design",
      "Fragment-based drug design",
      "SAR optimization",
      "Synthetic route planning",
    ],
    availability: "available",
    rating: 4.9,
    reviewCount: 47,
    hourlyRate: 250,
    operatesOn: ["compounds", "projects"],
    category: "experimental",
    bio: "15+ years in medicinal chemistry at Pfizer and Novartis. Expert in oncology kinase programs.",
    initials: "EV",
  },
  {
    id: "exp-002",
    name: "Dr. Raj Patel",
    title: "Computational Biologist",
    specialties: [
      "Molecular dynamics",
      "Homology modeling",
      "Virtual screening",
      "QSAR modeling",
    ],
    availability: "available",
    rating: 4.8,
    reviewCount: 32,
    hourlyRate: 200,
    operatesOn: ["compounds", "targets"],
    category: "computational",
    bio: "Specialist in structure-based drug design with 10+ years at AstraZeneca.",
    initials: "RP",
  },
  {
    id: "exp-003",
    name: "Dr. Amanda Foster",
    title: "Clinical Pharmacologist",
    specialties: [
      "PK/PD modeling",
      "First-in-human dosing",
      "Drug-drug interactions",
      "Biomarker strategy",
    ],
    availability: "limited",
    rating: 4.95,
    reviewCount: 28,
    hourlyRate: 350,
    operatesOn: ["experiments", "projects"],
    category: "clinical",
    bio: "Former FDA reviewer. Expert in IND-enabling studies.",
    initials: "AF",
  },
  {
    id: "exp-004",
    name: "Dr. Wei Zhang",
    title: "Structural Biologist",
    specialties: [
      "X-ray crystallography",
      "Cryo-EM",
      "Protein purification",
      "Fragment screening",
    ],
    availability: "unavailable",
    rating: 4.7,
    reviewCount: 19,
    hourlyRate: 275,
    operatesOn: ["targets"],
    category: "experimental",
    bio: "Solved 50+ protein-ligand co-crystal structures.",
    initials: "WZ",
  },
  {
    id: "exp-005",
    name: "Dr. Lucia Romano",
    title: "Toxicologist",
    specialties: [
      "In vivo toxicology",
      "Genetic toxicology",
      "Safety pharmacology",
      "Regulatory toxicology",
    ],
    availability: "available",
    rating: 4.85,
    reviewCount: 38,
    hourlyRate: 300,
    operatesOn: ["compounds", "experiments"],
    category: "clinical",
    bio: "Board-certified toxicologist with IND-enabling and NDA experience.",
    initials: "LR",
  },
];

const filterCategories = [
  { label: "All", value: "all" },
  { label: "Computational", value: "computational" },
  { label: "Experimental", value: "experimental" },
  { label: "Clinical", value: "clinical" },
];

const entityChipColors: Record<string, string> = {
  compounds: "bg-blue-100 text-blue-800",
  targets: "bg-purple-100 text-purple-800",
  experiments: "bg-orange-100 text-orange-800",
  projects: "bg-green-100 text-green-800",
};

const statusBadgeColors: Record<string, string> = {
  available:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  busy: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  maintenance:
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const availabilityBadgeColors: Record<string, string> = {
  available:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  limited:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  unavailable:
    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const avatarColors: Record<string, string> = {
  computational: "bg-blue-500",
  experimental: "bg-purple-500",
  clinical: "bg-green-500",
};

export default function ServicesPage() {
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [expertFilter, setExpertFilter] = useState<string>("all");

  const filteredAgents =
    agentFilter === "all"
      ? agents
      : agents.filter((a) => a.category === agentFilter);

  const filteredExperts =
    expertFilter === "all"
      ? experts
      : experts.filter((e) => e.category === expertFilter);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Add-on Service</h1>
      <p className="text-muted-foreground mt-1">
        Deploy AI agents or consult human experts on your projects and assets
      </p>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="experts">Human Experts</TabsTrigger>
          <TabsTrigger value="office">Office Tools</TabsTrigger>
          <TabsTrigger value="create">Create Agent</TabsTrigger>
        </TabsList>

        {/* AI Agents Tab */}
        <TabsContent value="agents">
          <div className="flex gap-2 mb-6">
            {filterCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setAgentFilter(cat.value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                  agentFilter === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredAgents.map((agent) => (
              <Card key={agent.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base leading-snug flex-1 min-h-[2.5rem] line-clamp-2">
                      {agent.name}
                    </CardTitle>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize shrink-0",
                        statusBadgeColors[agent.status]
                      )}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                    {agent.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 pb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Capabilities
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {agent.capabilities.map((cap) => (
                      <li key={cap} className="truncate" title={cap}>• {cap}</li>
                    ))}
                  </ul>

                  {/* Footer — chips + stats + button pinned together at card bottom */}
                  <div className="mt-auto pt-3 border-t space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {agent.operatesOn.map((entity) => (
                        <span
                          key={entity}
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                            entityChipColors[entity]
                          )}
                        >
                          {entity}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{agent.successRate}%</span>
                      <span className="text-muted-foreground">{agent.avgRunTime}</span>
                      <span className="text-muted-foreground">{agent.creditsPerRun} credits</span>
                    </div>
                    <button
                      className="w-full rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={agent.status !== "available"}
                    >
                      Run Agent
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Human Experts Tab */}
        <TabsContent value="experts">
          <div className="flex gap-2 mb-6">
            {filterCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setExpertFilter(cat.value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                  expertFilter === cat.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {filteredExperts.map((expert) => (
              <Card key={expert.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex gap-3 items-start">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0",
                        avatarColors[expert.category]
                      )}
                    >
                      {expert.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{expert.name}</CardTitle>
                      <CardDescription className="truncate">{expert.title}</CardDescription>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize shrink-0",
                        availabilityBadgeColors[expert.availability]
                      )}
                    >
                      {expert.availability}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {expert.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {expert.specialties.map((spec) => (
                      <span
                        key={spec}
                        className="rounded-full bg-muted px-2.5 py-0.5 text-xs truncate max-w-[160px]"
                        title={spec}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {expert.operatesOn.map((entity) => (
                      <span
                        key={entity}
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          entityChipColors[entity]
                        )}
                      >
                        {entity}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm">{expert.rating}</span>
                      <span className="text-muted-foreground text-sm">
                        ({expert.reviewCount} reviews)
                      </span>
                    </div>
                    <span className="font-semibold text-sm">${expert.hourlyRate}/hr</span>
                  </div>

                  <button
                    className="w-full mt-3 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={expert.availability === "unavailable"}
                  >
                    Book Consultation
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        {/* Office Tools Tab */}
        <TabsContent value="office">
          <OfficeToolsSection />
        </TabsContent>

        {/* Create Agent Tab */}
        <TabsContent value="create">
          <CreateAgentSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreateAgentSection() {
  const [agentType, setAgentType] = useState<"local" | "remote">("local");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    endpoint: "",
    authToken: "",
    computeType: "cpu",
    timeout: "300",
    operatesOn: [] as string[],
    modelLevel: "A1",
  });

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create Custom Agent</CardTitle>
          <CardDescription>
            Deploy AI agents locally or connect to remote endpoints to process
            your projects and digital assets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Execution Mode */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Execution Mode
            </label>
            <div className="flex gap-2">
              {(["local", "remote"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAgentType(mode)}
                  className={cn(
                    "flex-1 rounded-md border px-4 py-3 text-sm font-medium transition-colors",
                    agentType === mode
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-input hover:bg-accent"
                  )}
                >
                  <div className="font-medium capitalize">{mode}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {mode === "local"
                      ? "Run on your machine using local compute"
                      : "Send requests to a remote endpoint and receive results"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Agent Name */}
          <div>
            <label className="text-sm font-medium" htmlFor="agent-name">
              Agent Name
            </label>
            <input
              id="agent-name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Custom ADMET Predictor"
              className={cn(inputClass, "mt-1")}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium" htmlFor="agent-desc">
              Description
            </label>
            <textarea
              id="agent-desc"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What does this agent do?"
              rows={2}
              className={cn(inputClass, "mt-1 resize-none")}
            />
          </div>

          {/* Remote-specific fields */}
          {agentType === "remote" && (
            <>
              <div>
                <label className="text-sm font-medium" htmlFor="endpoint">
                  Endpoint URL
                </label>
                <input
                  id="endpoint"
                  type="url"
                  value={formData.endpoint}
                  onChange={(e) =>
                    setFormData({ ...formData, endpoint: e.target.value })
                  }
                  placeholder="https://api.example.com/agent"
                  className={cn(inputClass, "mt-1")}
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="auth-token">
                  Auth Token
                </label>
                <input
                  id="auth-token"
                  type="password"
                  value={formData.authToken}
                  onChange={(e) =>
                    setFormData({ ...formData, authToken: e.target.value })
                  }
                  placeholder="Bearer token or API key"
                  className={cn(inputClass, "mt-1")}
                />
              </div>
            </>
          )}

          {/* Compute Type */}
          <div>
            <label className="text-sm font-medium" htmlFor="compute-type">
              Compute Type
            </label>
            <select
              id="compute-type"
              value={formData.computeType}
              onChange={(e) =>
                setFormData({ ...formData, computeType: e.target.value })
              }
              className={cn(inputClass, "mt-1")}
            >
              <option value="cpu">CPU</option>
              <option value="gpu">GPU (CUDA)</option>
              <option value="tpu">TPU</option>
              <option value="auto">Auto-detect</option>
            </select>
          </div>

          {/* Timeout */}
          <div>
            <label className="text-sm font-medium" htmlFor="timeout">
              Timeout (seconds)
            </label>
            <input
              id="timeout"
              type="number"
              value={formData.timeout}
              onChange={(e) =>
                setFormData({ ...formData, timeout: e.target.value })
              }
              className={cn(inputClass, "mt-1")}
            />
          </div>

          {/* Model Level */}
          <div>
            <label className="text-sm font-medium" htmlFor="model-level">
              AIDD 2.0 Model Level
            </label>
            <select
              id="model-level"
              value={formData.modelLevel}
              onChange={(e) =>
                setFormData({ ...formData, modelLevel: e.target.value })
              }
              className={cn(inputClass, "mt-1")}
            >
              <option value="A1">A1 — Gene/Protein Target</option>
              <option value="A2">A2 — Pathway & Gene Signature</option>
              <option value="A3">A3 — Network for Target</option>
              <option value="A4">A4 — Whole Cell</option>
              <option value="A5">A5 — Whole Tissue</option>
              <option value="A6">A6 — Whole Organ</option>
              <option value="A7">A7 — Human Patient</option>
              <option value="A8">A8 — Patient Cohort</option>
              <option value="A9">A9 — Disease Population</option>
              <option value="A10">A10 — Whole Population</option>
            </select>
          </div>

          {/* Operates On */}
          <div>
            <label className="text-sm font-medium block mb-2">
              Operates On
            </label>
            <div className="flex flex-wrap gap-2">
              {["compounds", "targets", "experiments", "projects"].map(
                (entity) => (
                  <button
                    key={entity}
                    onClick={() => {
                      const ops = formData.operatesOn.includes(entity)
                        ? formData.operatesOn.filter((o) => o !== entity)
                        : [...formData.operatesOn, entity];
                      setFormData({ ...formData, operatesOn: ops });
                    }}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                      formData.operatesOn.includes(entity)
                        ? entityChipColors[entity]
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {entity}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Submit */}
          <button className="w-full rounded-md px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">
            {agentType === "local" ? "Create Local Agent" : "Connect Remote Agent"}
          </button>
        </CardContent>
      </Card>

      {/* Active Custom Agents */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Custom Agents</CardTitle>
          <CardDescription>
            Agents you have created or connected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Local ADMET Screener", type: "local", status: "idle", level: "A4" },
              { name: "Remote Docking Service", type: "remote", status: "running", level: "A1" },
            ].map((agent) => (
              <div
                key={agent.name}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div>
                  <p className="text-sm font-medium">{agent.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                      {agent.type}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      {agent.level}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                    agent.status === "running"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  )}
                >
                  {agent.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Office Tools ──────────────────────────────────────────────────────────────

interface TestStep {
  label: string;    // what we're checking, e.g. "Validating OAuth token"
  result: string;   // realistic simulated outcome, e.g. "Token active · expires in 89 days"
  ok: boolean;      // whether this step is a pass
}

interface OfficeTool {
  id: string;
  name: string;
  logo: string;
  logoColor: string;
  oauthColor: string;       // hex color for OAuth popup branding
  description: string;
  permissions: string[];
  category: "Productivity" | "Storage" | "Communication" | "Automation" | "Media";
  authType: "oauth" | "api-key" | "embed";
  apiKeyPlaceholder?: string;
  apiKeyHint?: string;
  testSteps: TestStep[];    // shown in the test modal
}

type ConnectionState = "disconnected" | "connecting" | "connected" | "testing" | "error";

interface ConnectionInfo {
  state: ConnectionState;
  account?: string;          // email/username shown after connect
  testedAt?: string;         // last successful test timestamp
  testError?: string;        // last test error message
  apiKey?: string;           // stored api key value (api-key auth only)
}

const STORAGE_KEY = "sdd-office-connections";

function loadConnections(): Record<string, ConnectionInfo> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveConnections(data: Record<string, ConnectionInfo>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

const officeTools: OfficeTool[] = [
  {
    id: "notion",
    name: "Notion",
    logo: "N",
    logoColor: "bg-gray-800 text-white",
    oauthColor: "#000000",
    description: "Link Notion workspaces to sync project notes, SOPs, and meeting summaries",
    permissions: ["Read/write selected pages only", "No bulk workspace access", "No private pages"],
    category: "Productivity",
    authType: "oauth",
    testSteps: [
      { label: "Validating OAuth token", result: "Token active · scope: notion.page.read, notion.page.write · expires in 89 days", ok: true },
      { label: "Listing accessible workspaces", result: "3 workspaces found: Lab Notebook, SPARC-2026, Meeting Notes", ok: true },
      { label: "Verifying read/write scope on selected pages", result: "Selected pages: read ✓, write ✓ · Private pages: blocked ✓", ok: true },
      { label: "Confirming no bulk workspace access", result: "Workspace-level read scope absent — minimal permissions confirmed", ok: true },
    ],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    logo: "GD",
    logoColor: "bg-blue-500 text-white",
    oauthColor: "#1a73e8",
    description: "Access Google Drive files you explicitly share for import into projects",
    permissions: ["Access only files you select", "No browsing full Drive", "No deletion rights"],
    category: "Storage",
    authType: "oauth",
    testSteps: [
      { label: "Validating OAuth 2.0 access token", result: "Token active · last refresh 2 min ago · scope: drive.file", ok: true },
      { label: "Listing explicitly shared files", result: "2 files accessible: compound_library.xlsx, EGFR_screen_results.csv", ok: true },
      { label: "Fetching file metadata (read test)", result: "Metadata fetched for compound_library.xlsx · 0 bytes transferred · OK", ok: true },
      { label: "Confirming full Drive browse is blocked", result: "drive.readonly scope absent — no full Drive access confirmed", ok: true },
      { label: "Confirming deletion rights absent", result: "drive.delete scope absent — deletion blocked ✓", ok: true },
    ],
  },
  {
    id: "onedrive",
    name: "OneDrive",
    logo: "OD",
    logoColor: "bg-sky-500 text-white",
    oauthColor: "#0078d4",
    description: "Import files from OneDrive and sync reports back to selected folders",
    permissions: ["Read/write selected folders only", "No account-level access", "No email access"],
    category: "Storage",
    authType: "oauth",
    testSteps: [
      { label: "Validating Microsoft OAuth 2.0 token", result: "Token active · scope: Files.ReadWrite.Selected · tenant: uab.edu", ok: true },
      { label: "Listing granted folder access", result: "1 folder accessible: /Research/SPARC-2026 · 14 files", ok: true },
      { label: "Write permission smoke test", result: "Created SDD_connectivity_test.tmp → verified → deleted immediately · OK", ok: true },
      { label: "Confirming account-level access is blocked", result: "Files.Read.All scope absent — folder-scoped only ✓", ok: true },
      { label: "Confirming mail/calendar scopes absent", result: "Mail.Read, Calendars.Read not present in token ✓", ok: true },
    ],
  },
  {
    id: "box",
    name: "BOX",
    logo: "B",
    logoColor: "bg-blue-700 text-white",
    oauthColor: "#0061d5",
    description: "Access BOX-hosted documents and compound libraries for regulated storage",
    permissions: ["Selected folder access only", "Read-only by default", "Audit log preserved"],
    category: "Storage",
    authType: "oauth",
    testSteps: [
      { label: "Authenticating with BOX API v2", result: "Authenticated · user: researcher@uab.edu · app: SmartDrugDiscovery", ok: true },
      { label: "Listing granted folder contents", result: "Folder 'Compound Libraries' (ID: 112358) · 14 files · last modified Mar 28", ok: true },
      { label: "Verifying read-only scope", result: "write scope absent — read-only mode confirmed ✓", ok: true },
      { label: "Checking enterprise audit log status", result: "Audit log active · last entry: 2026-03-28 11:42 UTC · retention: 90 days", ok: true },
    ],
  },
  {
    id: "gmail",
    name: "Gmail",
    logo: "G",
    logoColor: "bg-red-500 text-white",
    oauthColor: "#ea4335",
    description: "Send platform notifications and experiment summaries via Gmail",
    permissions: ["Send-only (no read access)", "No inbox scanning", "Unsubscribe anytime"],
    category: "Communication",
    authType: "oauth",
    testSteps: [
      { label: "Validating Gmail OAuth token", result: "Token active · scope: gmail.send only · no read/modify scopes", ok: true },
      { label: "Sending test notification email", result: "Test email delivered to jakechen@gmail.com · Message-ID: <sdd-test-2026@gmail> · 12 ms", ok: true },
      { label: "Confirming inbox scanning is blocked", result: "gmail.readonly, gmail.modify scopes absent — no inbox access ✓", ok: true },
      { label: "Verifying unsubscribe header present", result: "List-Unsubscribe header injected into all outbound messages ✓", ok: true },
    ],
  },
  {
    id: "calendar",
    name: "Google Calendar",
    logo: "Cal",
    logoColor: "bg-green-600 text-white",
    oauthColor: "#1e8e3e",
    description: "Schedule experiment runs, milestone reviews, and team syncs",
    permissions: ["Read free/busy only", "Write new events only", "No existing event access"],
    category: "Productivity",
    authType: "oauth",
    testSteps: [
      { label: "Validating Calendar OAuth token", result: "Token active · scope: calendar.events.owned, calendar.freebusy", ok: true },
      { label: "Querying free/busy information", result: "Free/busy query succeeded · 3 busy blocks today · no event titles exposed", ok: true },
      { label: "Creating and deleting a test event", result: "Event 'SDD Connectivity Test' created at 03:00 → deleted immediately · OK", ok: true },
      { label: "Confirming existing event read is blocked", result: "calendar.readonly scope absent — existing events not accessible ✓", ok: true },
    ],
  },
  {
    id: "zapier",
    name: "Zapier",
    logo: "Z",
    logoColor: "bg-orange-500 text-white",
    oauthColor: "#ff4a00",
    description: "Trigger automated workflows when experiments complete or milestones are hit",
    permissions: ["Outbound webhooks only", "No inbound data stored", "Per-trigger authorization"],
    category: "Automation",
    authType: "api-key",
    apiKeyPlaceholder: "zap_xxxxxxxxxxxxxxxxxxxx",
    apiKeyHint: "Found in Zapier → Account → API Key",
    testSteps: [
      { label: "Validating Zapier API key", result: "Key valid · account: jakechen@gmail.com · plan: Professional", ok: true },
      { label: "Listing active Zaps for this app", result: "2 Zaps found: 'Experiment Complete → Slack', 'Milestone Hit → Email'", ok: true },
      { label: "Sending test webhook POST", result: "POST /hooks/catch/sdd-test → HTTP 200 · response: {status:'ok'} · 38 ms", ok: true },
      { label: "Confirming no inbound data is stored", result: "Webhook payload not persisted in Zapier storage — stateless confirmed ✓", ok: true },
    ],
  },
  {
    id: "readai",
    name: "read.ai",
    logo: "R",
    logoColor: "bg-purple-600 text-white",
    oauthColor: "#7c3aed",
    description: "Import meeting intelligence from lab meetings to auto-generate action items",
    permissions: ["Meeting summaries only", "No audio/video stored", "Speaker labels anonymized"],
    category: "Productivity",
    authType: "oauth",
    testSteps: [
      { label: "Validating read.ai OAuth token", result: "Token active · scope: meetings.summaries.read · no media scopes", ok: true },
      { label: "Listing recent meeting summaries", result: "3 meetings found: Lab Standup (Mar 28), SPARC Review (Mar 27), Grant Sync (Mar 25)", ok: true },
      { label: "Fetching latest meeting summary", result: "Summary fetched: 847 words · 6 action items · speaker labels anonymized ✓", ok: true },
      { label: "Confirming audio/video access is blocked", result: "meetings.recording, meetings.audio scopes absent — summaries only ✓", ok: true },
    ],
  },
  {
    id: "youtube",
    name: "YouTube",
    logo: "YT",
    logoColor: "bg-red-600 text-white",
    oauthColor: "#ff0000",
    description: "Embed scientific talks, assay protocols, and conference recordings in projects",
    permissions: ["Public video embed only", "No account login required", "No viewing history"],
    category: "Media",
    authType: "embed",
    testSteps: [
      { label: "Checking YouTube Data API v3 accessibility", result: "API reachable · status 200 · quota remaining: 9,847 units/day", ok: true },
      { label: "Testing public video embed lookup", result: "Sample video (Scientific Talk on EGFR): embeddable: true · captions: available", ok: true },
      { label: "Confirming no account auth required", result: "Request sent without OAuth credentials — public content accessible ✓", ok: true },
      { label: "Confirming viewing history is not tracked", result: "No user ID sent in request · no history scope · privacy-safe ✓", ok: true },
    ],
  },
];

const categoryColors: Record<OfficeTool["category"], string> = {
  Productivity:  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Storage:       "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  Communication: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  Automation:    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Media:         "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

// ── Connection Test Modal ─────────────────────────────────────────────────────

function ConnectionTestModal({
  tool,
  account,
  onDone,
}: {
  tool: OfficeTool;
  account?: string;
  onDone: (passed: boolean) => void;
}) {
  const [lines, setLines] = useState<{ label: string; result: string; ok: boolean; done: boolean }[]>([]);
  const [running, setRunning] = useState(true);
  const [allPassed, setAllPassed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      for (let i = 0; i < tool.testSteps.length; i++) {
        if (cancelled) return;
        const step = tool.testSteps[i];
        // Show step as "running"
        setLines((prev) => [...prev, { label: step.label, result: "", ok: step.ok, done: false }]);
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 500));
        if (cancelled) return;
        // Show result
        setLines((prev) =>
          prev.map((l, idx) => idx === i ? { ...l, result: step.result, done: true } : l)
        );
        await new Promise((r) => setTimeout(r, 200));
      }
      if (cancelled) return;
      const passed = tool.testSteps.every((s) => s.ok);
      setAllPassed(passed);
      setRunning(false);
    }
    run();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b">
          <span className={cn("h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0", tool.logoColor)}>
            {tool.logo}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{tool.name} — Connection Test</p>
              {running && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shrink-0" />}
            </div>
            {account && <p className="text-xs text-muted-foreground truncate">{account}</p>}
          </div>
          {!running && (
            <button onClick={() => onDone(allPassed ?? false)} className="rounded-md p-1.5 hover:bg-muted transition-colors text-muted-foreground">
              ✕
            </button>
          )}
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2.5 max-h-80">
          {lines.map((line, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 h-5 w-5 flex items-center justify-center">
                {!line.done ? (
                  <svg className="h-4 w-4 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75"/>
                  </svg>
                ) : line.ok ? (
                  <span className="text-green-500 text-sm font-bold">✓</span>
                ) : (
                  <span className="text-red-500 text-sm font-bold">✕</span>
                )}
              </span>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className={cn("text-xs font-medium", !line.done && "text-muted-foreground")}>{line.label}</p>
                {line.done && (
                  <p className={cn("text-xs font-mono leading-relaxed", line.ok ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                    {line.result}
                  </p>
                )}
              </div>
            </div>
          ))}
          {running && lines.length < tool.testSteps.length && (
            <div className="flex items-center gap-3">
              <svg className="h-4 w-4 animate-spin text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25"/>
                <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75"/>
              </svg>
              <p className="text-xs text-muted-foreground italic">Running next check…</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!running && (
          <div className={cn("px-5 py-4 border-t flex items-center justify-between gap-3",
            allPassed ? "bg-green-50 dark:bg-green-950/20" : "bg-red-50 dark:bg-red-950/20")}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{allPassed ? "✅" : "❌"}</span>
              <div>
                <p className={cn("text-sm font-semibold", allPassed ? "text-green-800 dark:text-green-300" : "text-red-700 dark:text-red-300")}>
                  {allPassed ? "All checks passed" : "One or more checks failed"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lines.filter((l) => l.ok && l.done).length}/{tool.testSteps.length} checks passed
                  {account && ` · ${account}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => onDone(allPassed ?? false)}
              className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OfficeToolsSection() {
  const [connections, setConnections] = useState<Record<string, ConnectionInfo>>({});
  const [catFilter,   setCatFilter]   = useState<string>("All");
  const [apiInputs,   setApiInputs]   = useState<Record<string, string>>({});
  const [showApiKey,  setShowApiKey]  = useState<Record<string, boolean>>({});
  const [testModal,   setTestModal]   = useState<OfficeTool | null>(null);

  // Load persisted connections on mount
  useEffect(() => { setConnections(loadConnections()); }, []);

  // Listen for OAuth popup messages
  const handleMessage = useCallback((e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    const { type, service, account } = e.data as { type: string; service: string; account: string };
    if (type === "oauth-complete" && service) {
      setConnections((prev) => {
        const next: Record<string, ConnectionInfo> = {
          ...prev,
          [service]: { state: "connected" as ConnectionState, account: account ?? "demo@smartdrugdiscovery.ai" },
        };
        saveConnections(next);
        return next;
      });
    }
    if (type === "oauth-denied" && service) {
      setConnections((prev) => {
        const next: Record<string, ConnectionInfo> = { ...prev, [service]: { state: "disconnected" as ConnectionState } };
        saveConnections(next);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Open OAuth popup
  function openOAuthPopup(tool: OfficeTool) {
    setConnections((prev) => {
      const next: Record<string, ConnectionInfo> = { ...prev, [tool.id]: { state: "connecting" as ConnectionState } };
      saveConnections(next);
      return next;
    });
    const params = new URLSearchParams({
      service: tool.id,
      name:    tool.name,
      color:   tool.oauthColor,
      logo:    tool.logo,
    });
    const popup = window.open(
      `/api/oauth-popup?${params}`,
      `oauth-${tool.id}`,
      "width=540,height=640,left=200,top=100,toolbar=no,menubar=no,scrollbars=yes,resizable=yes"
    );
    // Fallback: if popup closed without message, reset to disconnected
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        setConnections((prev) => {
          if (prev[tool.id]?.state === "connecting") {
            const next: Record<string, ConnectionInfo> = { ...prev, [tool.id]: { state: "disconnected" as ConnectionState } };
            saveConnections(next);
            return next;
          }
          return prev;
        });
      }
    }, 500);
  }

  // Connect API-key tool
  function connectApiKey(tool: OfficeTool) {
    const key = (apiInputs[tool.id] ?? "").trim();
    if (!key) return;
    setConnections((prev) => {
      const next: Record<string, ConnectionInfo> = { ...prev, [tool.id]: { state: "connected" as ConnectionState, account: "API key set", apiKey: key } };
      saveConnections(next);
      return next;
    });
  }

  // Enable embed tool
  function enableEmbed(tool: OfficeTool) {
    setConnections((prev) => {
      const next: Record<string, ConnectionInfo> = { ...prev, [tool.id]: { state: "connected" as ConnectionState, account: "Embed enabled" } };
      saveConnections(next);
      return next;
    });
  }

  // Open test modal for a service
  function openTestModal(toolId: string) {
    const tool = officeTools.find((t) => t.id === toolId);
    if (tool) setTestModal(tool);
  }

  // Called by modal when user closes — updates connection state
  function handleTestDone(passed: boolean) {
    if (!testModal) return;
    const toolId = testModal.id;
    setConnections((prev) => {
      const next: Record<string, ConnectionInfo> = {
        ...prev,
        [toolId]: {
          ...prev[toolId],
          state:     (passed ? "connected" : "error") as ConnectionState,
          testedAt:  passed ? new Date().toISOString() : prev[toolId]?.testedAt,
          testError: passed ? undefined : "One or more connection checks failed — please reconnect.",
        },
      };
      saveConnections(next);
      return next;
    });
    setTestModal(null);
  }

  // Disconnect
  function disconnect(toolId: string) {
    setConnections((prev) => {
      const next = { ...prev };
      delete next[toolId];
      saveConnections(next);
      return next;
    });
    setApiInputs((prev) => { const n = { ...prev }; delete n[toolId]; return n; });
  }

  const categories = ["All", "Productivity", "Storage", "Communication", "Automation", "Media"];
  const filtered   = catFilter === "All" ? officeTools : officeTools.filter((t) => t.category === catFilter);

  return (
    <div className="space-y-6">
      {/* Privacy notice */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 px-4 py-3 text-xs text-blue-800 dark:text-blue-300">
        <span className="font-semibold">Minimal permissions: </span>
        Each integration requests only the access strictly required for its function. File contents are processed transiently and never stored. See{" "}
        <a href="/settings?tab=privacy" className="underline underline-offset-2">Privacy &amp; Legal</a> for full details.
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              catFilter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        {filtered.map((tool) => {
          const conn       = connections[tool.id];
          const isConn     = conn?.state === "connected";
          const isConn_g   = conn?.state === "connecting";
          const hasError   = conn?.state === "error";

          return (
            <Card
              key={tool.id}
              className={cn(
                "flex flex-col transition-colors",
                isConn  && "border-green-300 dark:border-green-700",
                hasError && "border-red-300 dark:border-red-700"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", tool.logoColor)}>
                    {tool.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-sm font-semibold truncate">{tool.name}</CardTitle>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0", categoryColors[tool.category])}>
                        {tool.category}
                      </span>
                      {isConn && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                          Connected
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {tool.authType === "oauth" ? "OAuth 2.0" : tool.authType === "api-key" ? "API Key" : "Embed"}
                    </span>
                  </div>
                </div>
                <CardDescription className="text-xs line-clamp-2 mt-1">{tool.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 pb-4 space-y-3">
                {/* Permissions */}
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Permissions requested</p>
                  <ul className="space-y-0.5">
                    {tool.permissions.map((p) => (
                      <li key={p} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                        <span className="truncate" title={p}>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Connected account badge */}
                {isConn && conn?.account && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    <span className="font-medium">Account:</span> {conn.account}
                  </p>
                )}

                {/* Last test result */}
                {conn?.testedAt && !hasError && (
                  <p className="text-[11px] text-green-600 dark:text-green-400">
                    ✓ Last tested {new Date(conn.testedAt).toLocaleTimeString()}
                  </p>
                )}
                {hasError && conn?.testError && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 flex items-start gap-1">
                    <span>⚠</span> {conn.testError}
                  </p>
                )}

                {/* API key input — shown before connecting for api-key tools */}
                {tool.authType === "api-key" && !isConn && (
                  <div className="space-y-1.5">
                    <div className="relative flex items-center">
                      <input
                        type={showApiKey[tool.id] ? "text" : "password"}
                        value={apiInputs[tool.id] ?? ""}
                        onChange={(e) => setApiInputs((prev) => ({ ...prev, [tool.id]: e.target.value }))}
                        placeholder={tool.apiKeyPlaceholder ?? "Enter API key…"}
                        className="w-full rounded-md border bg-background px-3 py-1.5 text-xs pr-16 focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey((prev) => ({ ...prev, [tool.id]: !prev[tool.id] }))}
                        className="absolute right-2 text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey[tool.id] ? "Hide" : "Show"}
                      </button>
                    </div>
                    {tool.apiKeyHint && (
                      <p className="text-[10px] text-muted-foreground">{tool.apiKeyHint}</p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-auto space-y-2">
                  {!isConn && !isConn_g && (
                    <button
                      onClick={() => {
                        if (tool.authType === "oauth")   openOAuthPopup(tool);
                        else if (tool.authType === "api-key") connectApiKey(tool);
                        else enableEmbed(tool);
                      }}
                      disabled={tool.authType === "api-key" && !(apiInputs[tool.id]?.trim())}
                      className="w-full rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {tool.authType === "oauth"    ? "Connect via OAuth 2.0" :
                       tool.authType === "api-key"  ? "Save & Connect" :
                                                      "Enable Embed"}
                    </button>
                  )}

                  {isConn_g && (
                    <button disabled className="w-full rounded-md px-4 py-2 text-sm font-medium bg-primary/60 text-primary-foreground cursor-not-allowed flex items-center justify-center gap-2">
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"/>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75"/>
                      </svg>
                      Connecting…
                    </button>
                  )}

                  {isConn && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openTestModal(tool.id)}
                        className="flex-1 rounded-md px-3 py-1.5 text-xs font-medium border border-input bg-background hover:bg-accent transition-colors flex items-center justify-center gap-1.5"
                      >
                        🧪 Test Connection
                      </button>
                      <button
                        onClick={() => disconnect(tool.id)}
                        title="Disconnect"
                        className="rounded-md px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}

                  {hasError && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openTestModal(tool.id)}
                        className="flex-1 rounded-md px-3 py-1.5 text-xs font-medium border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:bg-orange-950/20 transition-colors"
                      >
                        Retry Test
                      </button>
                      <button
                        onClick={() => disconnect(tool.id)}
                        className="rounded-md px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Connection Test Modal */}
      {testModal && (
        <ConnectionTestModal
          tool={testModal}
          account={connections[testModal.id]?.account}
          onDone={handleTestDone}
        />
      )}
    </div>
  );
}
