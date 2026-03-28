"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Team data ──────────────────────────────────────────────────────────────────

const teams = [
  {
    name: "Oncology Team",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    members: [
      { name: "Dr. Sarah Chen",     role: "Principal Investigator", initials: "SC", expertise: ["BRAF inhibitors", "Kinase selectivity"] },
      { name: "Dr. Raj Patel",      role: "Computational Chemist",  initials: "RP", expertise: ["Molecular dynamics", "Virtual screening"] },
      { name: "Dr. Robert Kim",     role: "Project Lead",           initials: "RK", expertise: ["EGFR resistance", "IND filing"] },
      { name: "Dr. Lucia Romano",   role: "Regulatory Scientist",   initials: "LR", expertise: ["IND packages", "Toxicology"] },
    ],
    projects: ["BRAF Inhibitor Program", "EGFR-T790M Resistance Program", "JAK2 Inhibitor Optimization"],
  },
  {
    name: "Neurology Team",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    members: [
      { name: "Dr. James Wilson",   role: "Project Lead",           initials: "JW", expertise: ["Tau biology", "Neurodegeneration"] },
      { name: "Dr. Elena Vasquez",  role: "Medicinal Chemist",      initials: "EV", expertise: ["Fragment-based design", "Kinase inhibitors"] },
      { name: "Dr. Amanda Foster",  role: "Clinical Scientist",     initials: "AF", expertise: ["Biomarkers", "Clinical feasibility"] },
      { name: "Dr. Wei Zhang",      role: "Structural Biologist",   initials: "WZ", expertise: ["X-ray crystallography", "Cryo-EM"] },
    ],
    projects: ["Alzheimer's Tau Program"],
  },
  {
    name: "AI Agents",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    members: [
      { name: "Drug-GPT",           role: "SMILES Generation Agent",    initials: "DG", expertise: ["Molecule design", "ADMET prediction"] },
      { name: "Literature Bot",     role: "Literature Mining Agent",     initials: "LB", expertise: ["PubMed analysis", "Trend extraction"] },
      { name: "ADMET Predictor",    role: "Property Prediction Agent",   initials: "AP", expertise: ["Toxicity", "PK/PD modeling"] },
    ],
    projects: ["All projects"],
  },
];

// ── Mock KG results ────────────────────────────────────────────────────────────

interface KGResult {
  name: string;
  initials: string;
  role: string;
  institution: string;
  matchScore: number;
  matchedSkills: string[];
  availability: "Available" | "Limited" | "Busy";
  projects: number;
  publications: number;
}

const mockKGResults: KGResult[] = [
  { name: "Dr. Sarah Chen",     initials: "SC", role: "Principal Investigator", institution: "UAB SysPAI",     matchScore: 97, matchedSkills: ["BRAF inhibitors", "Kinase selectivity", "IND experience"], availability: "Available", projects: 5, publications: 42 },
  { name: "Dr. Raj Patel",      initials: "RP", role: "Computational Chemist",  institution: "UAB SysPAI",     matchScore: 91, matchedSkills: ["Virtual screening", "QSAR", "Docking"], availability: "Limited",   projects: 4, publications: 28 },
  { name: "Dr. Elena Vasquez",  initials: "EV", role: "Medicinal Chemist",      institution: "Pfizer (alumni)", matchScore: 85, matchedSkills: ["SAR optimization", "Kinase inhibitors"],  availability: "Available", projects: 3, publications: 19 },
  { name: "Dr. Marcus Lee",     initials: "ML", role: "Structural Biologist",   institution: "MIT",             matchScore: 78, matchedSkills: ["X-ray crystallography", "Kinase structures"], availability: "Busy",      projects: 2, publications: 31 },
  { name: "Dr. Priya Sharma",   initials: "PS", role: "Medicinal Chemist",      institution: "AstraZeneca",     matchScore: 72, matchedSkills: ["Lead optimization", "Synthetic chemistry"],  availability: "Available", projects: 6, publications: 15 },
];

const availColor: Record<string, string> = {
  "Available": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Limited":   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Busy":      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// ── Avatar color helper ────────────────────────────────────────────────────────

function getColor(initials: string) {
  const palette = ["bg-blue-600","bg-green-600","bg-purple-600","bg-pink-600","bg-indigo-600","bg-teal-600","bg-orange-600"];
  let h = 0;
  for (let i = 0; i < initials.length; i++) h = initials.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

// ── Talent KG Search panel ─────────────────────────────────────────────────────

function TalentKGSearch() {
  const [project, setProject] = useState("BRAF Inhibitor Program");
  const [roles, setRoles] = useState("Medicinal Chemist, Computational Chemist");
  const [skills, setSkills] = useState("BRAF inhibitors, kinase selectivity, ADMET, docking");
  const [fileName, setFileName] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");
  const [added, setAdded] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFileName(f.name);
      // Auto-populate roles/skills from filename as a hint
    }
  };

  const runQuery = async () => {
    setPhase("loading");
    await new Promise((r) => setTimeout(r, 1800));
    setPhase("done");
  };

  const reset = () => { setPhase("idle"); setAdded(new Set()); };

  return (
    <Card className="border-purple-200 dark:border-purple-800">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-lg">Build Project Team</CardTitle>
            <CardDescription>
              Query the Talent Knowledge Graph MCP to find candidate team members
            </CardDescription>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-3 py-1 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
            Talent KG MCP
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {phase !== "done" && (
          <>
            {/* Project selector */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium block mb-1.5">Target Project</label>
                <select
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option>BRAF Inhibitor Program</option>
                  <option>Alzheimer&apos;s Tau Program</option>
                  <option>JAK2 Inhibitor Optimization</option>
                  <option>EGFR-T790M Resistance Program</option>
                </select>
              </div>

              {/* Excel upload */}
              <div>
                <label className="text-xs font-medium block mb-1.5">
                  Requirements Sheet <span className="text-muted-foreground font-normal">(optional .xlsx)</span>
                </label>
                <div
                  className="flex items-center gap-2 rounded-md border border-dashed border-input bg-muted/30 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <svg className="h-4 w-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <span className="text-sm text-muted-foreground truncate">
                    {fileName ?? "Upload Excel sheet…"}
                  </span>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
                </div>
              </div>
            </div>

            {/* Role / Skills inputs */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium block mb-1.5">Roles Needed</label>
                <input
                  type="text"
                  value={roles}
                  onChange={(e) => setRoles(e.target.value)}
                  placeholder="e.g., Medicinal Chemist, Bioinformatician"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5">Required Skills</label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g., kinase selectivity, ADMET, IND experience"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <button
              onClick={runQuery}
              disabled={phase === "loading"}
              className="rounded-lg bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {phase === "loading" ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.3" />
                    <path d="M21 12a9 9 0 00-9-9" />
                  </svg>
                  Querying Talent Knowledge Graph…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Find Candidates via Talent KG MCP
                </>
              )}
            </button>
          </>
        )}

        {/* Results */}
        {phase === "done" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {mockKGResults.length} candidates matched for <span className="text-primary">{project}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Ranked by skill match · Talent KG MCP query completed in 1.8 s</p>
              </div>
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                × New query
              </button>
            </div>

            {mockKGResults.map((r) => (
              <div key={r.name} className="flex items-start gap-3 rounded-lg border p-3">
                {/* Score ring */}
                <div className="relative shrink-0">
                  <div className={cn("h-11 w-11 rounded-full flex items-center justify-center text-white text-sm font-semibold", getColor(r.initials))}>
                    {r.initials}
                  </div>
                  <span className={cn(
                    "absolute -bottom-1 -right-1 rounded-full px-1 py-0.5 text-[9px] font-bold leading-none",
                    r.matchScore >= 90 ? "bg-green-500 text-white" : r.matchScore >= 80 ? "bg-blue-500 text-white" : "bg-yellow-500 text-white"
                  )}>
                    {r.matchScore}%
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", availColor[r.availability])}>
                      {r.availability}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.role} · {r.institution}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {r.matchedSkills.map((s) => (
                      <span key={s} className="rounded bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] font-medium">{s}</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{r.projects} projects · {r.publications} publications</p>
                </div>

                <button
                  onClick={() => setAdded((prev) => { const n = new Set(prev); n.has(r.name) ? n.delete(r.name) : n.add(r.name); return n; })}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    added.has(r.name)
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {added.has(r.name) ? "✓ Added" : "+ Add"}
                </button>
              </div>
            ))}

            {added.size > 0 && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-300">
                {added.size} candidate{added.size > 1 ? "s" : ""} added to <strong>{project}</strong> team. Review in the project directory.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Team Directory</h1>
        <p className="text-muted-foreground text-sm mt-1">Researchers, clinicians, and AI agents grouped by domain team</p>
      </div>

      {/* Talent KG search panel */}
      <TalentKGSearch />

      {/* Team cards */}
      {teams.map((team) => (
        <Card key={team.name}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg">{team.name}</CardTitle>
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", team.color)}>
                {team.members.length} members
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Projects: {team.projects.join(" · ")}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {team.members.map((m) => (
                <div key={m.name} className="flex items-start gap-3 rounded-lg border p-3">
                  <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0", getColor(m.initials))}>
                    {m.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.role}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {m.expertise.map((e) => (
                        <span key={e} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{e}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
