"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type ProjectStatus = "active" | "paused" | "completed";
type KanbanStatus = "todo" | "in-progress" | "completed";

interface TeamMember {
  name: string;
  role: string;
  expertise: string[];
  initials: string;
  projects: string[];
}

interface ProjectAsset {
  name: string;
  type: "document" | "dataset" | "compound-library" | "model" | "report";
  project: string;
  addedBy: string;
  date: string;
  size: string;
}

interface KanbanTask {
  id: string;
  title: string;
  project: string;
  assignee: string;
  priority: "high" | "medium" | "low";
  status: KanbanStatus;
}

interface Project {
  id: string;
  name: string;
  group: string;
  description: string;
  status: ProjectStatus;
  targetCount: number;
  compoundCount: number;
  lead: string;
  team: string[];
  startDate: string;
  endDate: string;
  lastUpdated: string;
  milestones: { name: string; date: string; done: boolean }[];
  age: { activity: number; goal: number; execution: number };  // 0-100 each
}

const projectGroups = ["Oncology", "Neurology", "Immunology"];

const projects: Project[] = [
  {
    id: "PRJ-001",
    name: "BRAF Inhibitor Program",
    group: "Oncology",
    description:
      "Development of next-generation BRAF V600E inhibitors for metastatic melanoma with improved selectivity and reduced paradoxical ERK activation.",
    status: "active",
    targetCount: 3,
    compoundCount: 45,
    lead: "Dr. Sarah Chen",
    team: ["Dr. Sarah Chen", "Dr. Raj Patel", "Dr. Wei Zhang"],
    startDate: "2025-01-15",
    endDate: "2026-06-30",
    lastUpdated: "2 days ago",
    age: { activity: 88, goal: 75, execution: 91 },
    milestones: [
      { name: "Hit ID", date: "2025-03-01", done: true },
      { name: "Lead Optimization", date: "2025-08-15", done: true },
      { name: "Candidate Selection", date: "2026-01-30", done: false },
      { name: "IND Filing", date: "2026-06-30", done: false },
    ],
  },
  {
    id: "PRJ-002",
    name: "Alzheimer's Tau Program",
    group: "Neurology",
    description:
      "Targeting tau protein aggregation through small molecule inhibitors of tau phosphorylation and development of BACE1 inhibitors.",
    status: "active",
    targetCount: 4,
    compoundCount: 62,
    lead: "Dr. James Wilson",
    team: ["Dr. James Wilson", "Dr. Elena Vasquez", "Dr. Amanda Foster"],
    startDate: "2024-09-01",
    endDate: "2026-12-31",
    lastUpdated: "1 day ago",
    age: { activity: 92, goal: 62, execution: 78 },
    milestones: [
      { name: "Target Validation", date: "2025-01-15", done: true },
      { name: "Hit-to-Lead", date: "2025-06-01", done: true },
      { name: "Lead Optimization", date: "2026-03-01", done: false },
      { name: "Preclinical", date: "2026-12-31", done: false },
    ],
  },
  {
    id: "PRJ-003",
    name: "JAK2 Inhibitor Optimization",
    group: "Oncology",
    description:
      "Lead optimization of selective JAK2 inhibitors for myeloproliferative neoplasms with reduced off-target kinase activity.",
    status: "paused",
    targetCount: 2,
    compoundCount: 28,
    lead: "Dr. Maria Rodriguez",
    team: ["Dr. Maria Rodriguez", "Dr. Raj Patel"],
    startDate: "2024-06-01",
    endDate: "2025-12-31",
    lastUpdated: "2 weeks ago",
    age: { activity: 28, goal: 67, execution: 54 },
    milestones: [
      { name: "Selectivity Screen", date: "2024-09-01", done: true },
      { name: "Lead Series", date: "2025-03-01", done: true },
      { name: "ADMET Profiling", date: "2025-09-01", done: false },
    ],
  },
  {
    id: "PRJ-004",
    name: "EGFR-T790M Resistance Program",
    group: "Oncology",
    description:
      "Third-generation EGFR inhibitors designed to overcome T790M gatekeeper resistance mutation in non-small cell lung cancer.",
    status: "completed",
    targetCount: 2,
    compoundCount: 38,
    lead: "Dr. Robert Kim",
    team: ["Dr. Robert Kim", "Dr. Sarah Chen", "Dr. Lucia Romano"],
    startDate: "2023-03-01",
    endDate: "2025-02-28",
    lastUpdated: "1 month ago",
    age: { activity: 0, goal: 100, execution: 96 },
    milestones: [
      { name: "HTS Campaign", date: "2023-06-01", done: true },
      { name: "Lead Optimization", date: "2024-01-15", done: true },
      { name: "Candidate Nomination", date: "2024-09-01", done: true },
      { name: "IND Enabling", date: "2025-02-28", done: true },
    ],
  },
];

const teamMembers: TeamMember[] = [
  {
    name: "Dr. Sarah Chen",
    role: "Principal Investigator",
    expertise: ["BRAF inhibitors", "Kinase selectivity", "Oncology"],
    initials: "SC",
    projects: ["BRAF Inhibitor Program", "EGFR-T790M Resistance Program"],
  },
  {
    name: "Dr. James Wilson",
    role: "Project Lead",
    expertise: ["Tau biology", "Neurodegeneration", "Protein aggregation"],
    initials: "JW",
    projects: ["Alzheimer's Tau Program"],
  },
  {
    name: "Dr. Raj Patel",
    role: "Computational Chemist",
    expertise: ["Molecular dynamics", "Virtual screening", "QSAR"],
    initials: "RP",
    projects: ["BRAF Inhibitor Program", "JAK2 Inhibitor Optimization"],
  },
  {
    name: "Dr. Maria Rodriguez",
    role: "Medicinal Chemist",
    expertise: ["JAK inhibitors", "SAR optimization", "Synthetic chemistry"],
    initials: "MR",
    projects: ["JAK2 Inhibitor Optimization"],
  },
  {
    name: "Dr. Elena Vasquez",
    role: "Medicinal Chemist",
    expertise: ["Fragment-based design", "Kinase inhibitors", "Lead optimization"],
    initials: "EV",
    projects: ["Alzheimer's Tau Program"],
  },
  {
    name: "Dr. Wei Zhang",
    role: "Structural Biologist",
    expertise: ["X-ray crystallography", "Cryo-EM", "Protein structures"],
    initials: "WZ",
    projects: ["BRAF Inhibitor Program"],
  },
];

const kanbanTasks: KanbanTask[] = [
  { id: "T-001", title: "Synthesize BRAF analog series 5", project: "BRAF Inhibitor Program", assignee: "Dr. Wei Zhang", priority: "high", status: "todo" },
  { id: "T-002", title: "Review tau aggregation assay data", project: "Alzheimer's Tau Program", assignee: "Dr. James Wilson", priority: "medium", status: "todo" },
  { id: "T-003", title: "Prepare IND toxicology package", project: "EGFR-T790M Resistance Program", assignee: "Dr. Lucia Romano", priority: "high", status: "todo" },
  { id: "T-004", title: "Run CYP450 inhibition panel", project: "BRAF Inhibitor Program", assignee: "Dr. Sarah Chen", priority: "high", status: "in-progress" },
  { id: "T-005", title: "Dock JAK2 selective candidates", project: "JAK2 Inhibitor Optimization", assignee: "Dr. Raj Patel", priority: "medium", status: "in-progress" },
  { id: "T-006", title: "Optimize tau PET tracer binding", project: "Alzheimer's Tau Program", assignee: "Dr. Elena Vasquez", priority: "medium", status: "in-progress" },
  { id: "T-007", title: "Complete selectivity profiling", project: "BRAF Inhibitor Program", assignee: "Dr. Raj Patel", priority: "high", status: "completed" },
  { id: "T-008", title: "Submit patent application", project: "EGFR-T790M Resistance Program", assignee: "Dr. Robert Kim", priority: "medium", status: "completed" },
  { id: "T-009", title: "Finalize lead compound report", project: "JAK2 Inhibitor Optimization", assignee: "Dr. Maria Rodriguez", priority: "low", status: "completed" },
];

const assets: ProjectAsset[] = [
  { name: "BRAF_SAR_Report_v3.pdf", type: "document", project: "BRAF Inhibitor Program", addedBy: "Dr. Sarah Chen", date: "Mar 15, 2026", size: "2.4 MB" },
  { name: "Tau_Screening_Data.csv", type: "dataset", project: "Alzheimer's Tau Program", addedBy: "Dr. James Wilson", date: "Mar 10, 2026", size: "15.7 MB" },
  { name: "BRAF_Compound_Library.sdf", type: "compound-library", project: "BRAF Inhibitor Program", addedBy: "Dr. Raj Patel", date: "Mar 8, 2026", size: "8.2 MB" },
  { name: "JAK2_ADMET_Model.pkl", type: "model", project: "JAK2 Inhibitor Optimization", addedBy: "Dr. Maria Rodriguez", date: "Feb 28, 2026", size: "156 MB" },
  { name: "EGFR_IND_Report.pdf", type: "report", project: "EGFR-T790M Resistance Program", addedBy: "Dr. Robert Kim", date: "Feb 15, 2026", size: "4.8 MB" },
  { name: "Tau_Cryo-EM_Structures.pdb", type: "dataset", project: "Alzheimer's Tau Program", addedBy: "Dr. Wei Zhang", date: "Feb 10, 2026", size: "32 MB" },
  { name: "BRAF_Docking_Results.csv", type: "dataset", project: "BRAF Inhibitor Program", addedBy: "Dr. Raj Patel", date: "Jan 30, 2026", size: "5.1 MB" },
  { name: "Clinical_Feasibility_Analysis.docx", type: "document", project: "EGFR-T790M Resistance Program", addedBy: "Dr. Amanda Foster", date: "Jan 20, 2026", size: "1.2 MB" },
];

// A.G.E. = Activity · Goal-progress · Execution composite score (0–100 each)
function ageGrade(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "A", color: "text-green-700 dark:text-green-400" };
  if (score >= 80) return { label: "B+", color: "text-green-600 dark:text-green-500" };
  if (score >= 70) return { label: "B", color: "text-blue-600 dark:text-blue-400" };
  if (score >= 60) return { label: "C+", color: "text-yellow-600 dark:text-yellow-400" };
  if (score >= 50) return { label: "C", color: "text-orange-600 dark:text-orange-400" };
  return { label: "D", color: "text-red-600 dark:text-red-400" };
}
function ageComposite(age: { activity: number; goal: number; execution: number }) {
  return Math.round((age.activity * 0.3 + age.goal * 0.4 + age.execution * 0.3));
}

const statusConfig: Record<ProjectStatus, { label: string; className: string; dotColor: string }> = {
  active: {
    label: "Active",
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    dotColor: "bg-green-500",
  },
  paused: {
    label: "Paused",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    dotColor: "bg-yellow-500",
  },
  completed: {
    label: "Completed",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
    dotColor: "bg-gray-400",
  },
};

const priorityConfig: Record<KanbanTask["priority"], { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  medium: { label: "Medium", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  low: { label: "Low", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
};

const assetTypeConfig: Record<ProjectAsset["type"], { label: string; className: string }> = {
  document: { label: "Document", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  dataset: { label: "Dataset", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  "compound-library": { label: "Compound Library", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  model: { label: "Model", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  report: { label: "Report", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300" },
};

function getInitialColor(initials: string) {
  const colors = [
    "bg-blue-600", "bg-green-600", "bg-purple-600",
    "bg-pink-600", "bg-indigo-600", "bg-teal-600",
  ];
  let hash = 0;
  for (let i = 0; i < initials.length; i++) {
    hash = initials.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function dateToPercent(date: string, minDate: string, maxDate: string) {
  const d = new Date(date).getTime();
  const min = new Date(minDate).getTime();
  const max = new Date(maxDate).getTime();
  if (max === min) return 0;
  return Math.max(0, Math.min(100, ((d - min) / (max - min)) * 100));
}

export default function ProjectsPage() {
  const [groupFilter, setGroupFilter] = useState<string>("All");

  const filteredProjects =
    groupFilter === "All" ? projects : projects.filter((p) => p.group === groupFilter);

  // Timeline global range
  const allDates = projects.flatMap((p) => [p.startDate, p.endDate]);
  const globalMin = allDates.reduce((a, b) => (a < b ? a : b));
  const globalMax = allDates.reduce((a, b) => (a > b ? a : b));

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground mt-1">
          Drug discovery programs and project management
        </p>
      </div>

      <Tabs defaultValue="overview">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="w-max min-w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="flex gap-2">
            {["All", ...projectGroups].map((group) => (
              <button
                key={group}
                onClick={() => setGroupFilter(group)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  groupFilter === group
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {group}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredProjects.map((project) => {
              const status = statusConfig[project.status];
              return (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription className="mt-1.5 line-clamp-2">
                          {project.description}
                        </CardDescription>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium shrink-0",
                          status.className
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", status.dotColor)} />
                        {status.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <div className="text-2xl font-bold">{project.targetCount}</div>
                        <div className="text-xs text-muted-foreground">Targets</div>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3 text-center">
                        <div className="text-2xl font-bold">{project.compoundCount}</div>
                        <div className="text-xs text-muted-foreground">Compounds</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t pt-3">
                      <span className="text-muted-foreground">
                        Lead: <span className="text-foreground font-medium">{project.lead}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{project.lastUpdated}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{project.id}</span>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        {project.group}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Kanban Tab */}
        <TabsContent value="kanban" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(["todo", "in-progress", "completed"] as KanbanStatus[]).map((colStatus) => {
              const columnTasks = kanbanTasks.filter((t) => t.status === colStatus);
              const columnLabel =
                colStatus === "todo" ? "To Do" : colStatus === "in-progress" ? "In Progress" : "Completed";
              return (
                <div key={colStatus} className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{columnLabel}</h3>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                      {columnTasks.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {columnTasks.map((task) => {
                      const prio = priorityConfig[task.priority];
                      return (
                        <Card key={task.id}>
                          <CardContent className="p-4 space-y-2">
                            <p className="font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.project}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">{task.assignee}</span>
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-xs font-medium",
                                  prio.className
                                )}
                              >
                                {prio.label}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-6 space-y-4">
          {projects.map((project) => {
            const status = statusConfig[project.status];
            const barLeft = dateToPercent(project.startDate, globalMin, globalMax);
            const barRight = dateToPercent(project.endDate, globalMin, globalMax);
            return (
              <Card key={project.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-56 shrink-0">
                      <p className="font-medium text-sm">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.startDate} — {project.endDate}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium shrink-0",
                        status.className
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", status.dotColor)} />
                      {status.label}
                    </span>
                  </div>
                  <div className="relative h-8 bg-muted/40 rounded-full">
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full bg-primary/30"
                      style={{ left: `${barLeft}%`, width: `${barRight - barLeft}%` }}
                    />
                    {project.milestones.map((ms, i) => {
                      const pos = dateToPercent(ms.date, globalMin, globalMax);
                      return (
                        <div
                          key={i}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                          style={{ left: `${pos}%` }}
                          title={`${ms.name} (${ms.date})`}
                        >
                          <div
                            className={cn(
                              "h-4 w-4 rounded-full border-2",
                              ms.done
                                ? "bg-green-500 border-green-500"
                                : "bg-background border-muted-foreground"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    {project.milestones.map((ms, i) => (
                      <span key={i} className={cn(ms.done && "text-green-600 dark:text-green-400")}>
                        {ms.name}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <Card key={member.name}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-sm",
                        getInitialColor(member.initials)
                      )}
                    >
                      {member.initials}
                    </div>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {member.expertise.map((exp) => (
                      <span
                        key={exp}
                        className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-1.5">Projects</p>
                    {member.projects.map((proj) => (
                      <p key={proj} className="text-sm">
                        {proj}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Name</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Project</th>
                      <th className="text-left p-4 font-medium">Added By</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-right p-4 font-medium">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((asset) => {
                      const typeConf = assetTypeConfig[asset.type];
                      return (
                        <tr key={asset.name} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-4 font-medium">{asset.name}</td>
                          <td className="p-4">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                                typeConf.className
                              )}
                            >
                              {typeConf.label}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">{asset.project}</td>
                          <td className="p-4 text-muted-foreground">{asset.addedBy}</td>
                          <td className="p-4 text-muted-foreground">{asset.date}</td>
                          <td className="p-4 text-right text-muted-foreground">{asset.size}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
