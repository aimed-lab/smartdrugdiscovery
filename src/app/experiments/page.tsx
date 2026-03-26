"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Experiment {
  id: string;
  name: string;
  type: string;
  status: "planned" | "running" | "completed" | "failed";
  project: string;
  startDate: string;
  compounds: number;
}

const experiments: Experiment[] = [
  { id: "EXP-001", name: "ADMET Screening Panel", type: "ADMET", status: "completed", project: "BRAF Inhibitor Program", startDate: "2025-12-15", compounds: 24 },
  { id: "EXP-002", name: "BRAF Kinase Binding Assay", type: "Binding Assay", status: "completed", project: "BRAF Inhibitor Program", startDate: "2026-01-08", compounds: 12 },
  { id: "EXP-003", name: "Cell Viability (A375)", type: "Cell Viability", status: "running", project: "BRAF Inhibitor Program", startDate: "2026-03-01", compounds: 8 },
  { id: "EXP-004", name: "Tau Aggregation ThT Assay", type: "Aggregation Assay", status: "running", project: "Alzheimer's Tau Program", startDate: "2026-02-20", compounds: 16 },
  { id: "EXP-005", name: "BACE1 FRET IC50", type: "Enzyme Assay", status: "planned", project: "Alzheimer's Tau Program", startDate: "2026-04-01", compounds: 20 },
  { id: "EXP-006", name: "CYP450 Inhibition Panel", type: "ADMET", status: "failed", project: "JAK2 Inhibitor Optimization", startDate: "2026-01-22", compounds: 10 },
  { id: "EXP-007", name: "hERG Channel Safety", type: "Safety", status: "completed", project: "EGFR-T790M Resistance Program", startDate: "2025-11-10", compounds: 6 },
  { id: "EXP-008", name: "JAK2 Selectivity Panel", type: "Selectivity Assay", status: "planned", project: "JAK2 Inhibitor Optimization", startDate: "2026-04-15", compounds: 14 },
];

const statusConfig: Record<Experiment["status"], { label: string; className: string }> = {
  planned: { label: "Planned", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  running: { label: "Running", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  failed: { label: "Failed", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
};

export default function ExperimentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return experiments;
    return experiments.filter((e) => e.status === statusFilter);
  }, [statusFilter]);

  const counts = useMemo(() => ({
    planned: experiments.filter((e) => e.status === "planned").length,
    running: experiments.filter((e) => e.status === "running").length,
    completed: experiments.filter((e) => e.status === "completed").length,
    failed: experiments.filter((e) => e.status === "failed").length,
  }), []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Experiments</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage assays and experimental workflows
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Planned" count={counts.planned} color="text-blue-600" />
        <SummaryCard label="Running" count={counts.running} color="text-yellow-600" />
        <SummaryCard label="Completed" count={counts.completed} color="text-green-600" />
        <SummaryCard label="Failed" count={counts.failed} color="text-red-600" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">All Experiments</CardTitle>
              <CardDescription>Assays and screening experiments across projects</CardDescription>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="planned">Planned</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Compounds</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{exp.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{exp.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{exp.type}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusConfig[exp.status].className)}>
                        {statusConfig[exp.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{exp.project}</td>
                    <td className="px-4 py-3 text-sm tabular-nums text-muted-foreground">{exp.startDate}</td>
                    <td className="px-4 py-3 text-sm tabular-nums text-center">{exp.compounds}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No experiments match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Showing {filtered.length} of {experiments.length} experiments
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <div className={cn("text-2xl font-bold", color)}>{count}</div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </CardContent>
    </Card>
  );
}
