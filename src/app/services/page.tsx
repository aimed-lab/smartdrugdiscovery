"use client";

import { useState } from "react";
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

                  <div className="border-t my-3" />

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

                  <div className="flex items-center justify-between text-sm mt-auto pt-3">
                    <span className="font-medium">{agent.successRate}%</span>
                    <span className="text-muted-foreground">{agent.avgRunTime}</span>
                    <span className="text-muted-foreground">{agent.creditsPerRun} credits</span>
                  </div>

                  <button
                    className="w-full mt-3 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={agent.status !== "available"}
                  >
                    Run Agent
                  </button>
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
