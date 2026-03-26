"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "completed";
  targetCount: number;
  compoundCount: number;
  lead: string;
  lastUpdated: string;
}

const projects: Project[] = [
  {
    id: "PRJ-001",
    name: "BRAF Inhibitor Program",
    description: "Development of next-generation BRAF V600E inhibitors for metastatic melanoma with improved selectivity and reduced paradoxical ERK activation.",
    status: "active",
    targetCount: 3,
    compoundCount: 45,
    lead: "Dr. Sarah Chen",
    lastUpdated: "2 days ago",
  },
  {
    id: "PRJ-002",
    name: "Alzheimer's Tau Program",
    description: "Targeting tau protein aggregation through small molecule inhibitors of tau phosphorylation and development of BACE1 inhibitors.",
    status: "active",
    targetCount: 4,
    compoundCount: 62,
    lead: "Dr. James Wilson",
    lastUpdated: "1 day ago",
  },
  {
    id: "PRJ-003",
    name: "JAK2 Inhibitor Optimization",
    description: "Lead optimization of selective JAK2 inhibitors for myeloproliferative neoplasms with reduced off-target kinase activity.",
    status: "paused",
    targetCount: 2,
    compoundCount: 28,
    lead: "Dr. Maria Rodriguez",
    lastUpdated: "2 weeks ago",
  },
  {
    id: "PRJ-004",
    name: "EGFR-T790M Resistance Program",
    description: "Third-generation EGFR inhibitors designed to overcome T790M gatekeeper resistance mutation in non-small cell lung cancer.",
    status: "completed",
    targetCount: 2,
    compoundCount: 38,
    lead: "Dr. Robert Kim",
    lastUpdated: "1 month ago",
  },
];

const statusConfig: Record<Project["status"], { label: string; className: string; dotColor: string }> = {
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

export default function ProjectsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground mt-1">
          Drug discovery programs and project tracking
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((project) => {
          const status = statusConfig[project.status];
          return (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="mt-1.5 line-clamp-2">{project.description}</CardDescription>
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
                <div className="mt-2 text-xs text-muted-foreground">{project.id}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
