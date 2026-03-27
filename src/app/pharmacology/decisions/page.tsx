"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Decision = "Go" | "Conditional Go" | "No-Go";

interface DecisionReport {
  id: string;
  program: string;
  milestone: string;
  decision: Decision;
  date: string;
  confidence: number;
  keyEvidence: string;
  reviewer: string;
}

const decisions: DecisionReport[] = [
  {
    id: "DEC-PH-001",
    program: "BRAF Inhibitor",
    milestone: "Lead Selection",
    decision: "Go",
    date: "Mar 18, 2026",
    confidence: 90,
    keyEvidence: "SDD-0012 passes A1-A5, >100x selectivity, phototox mitigated",
    reviewer: "Dr. Sarah Chen",
  },
  {
    id: "DEC-PH-002",
    program: "JAK2 Inhibitor",
    milestone: "Lead Optimization",
    decision: "Conditional Go",
    date: "Mar 12, 2026",
    confidence: 75,
    keyEvidence: "SDD-0127 potent but CYP2D6 interaction needs resolution",
    reviewer: "Dr. Maria Rodriguez",
  },
  {
    id: "DEC-PH-003",
    program: "Alzheimer's Tau",
    milestone: "Hit-to-Lead",
    decision: "Go",
    date: "Mar 5, 2026",
    confidence: 82,
    keyEvidence: "3 scaffold series identified, BBB optimization ongoing",
    reviewer: "Dr. James Wilson",
  },
  {
    id: "DEC-PH-004",
    program: "EGFR Resistance",
    milestone: "Candidate Nomination",
    decision: "No-Go",
    date: "Feb 20, 2026",
    confidence: 55,
    keyEvidence: "hERG liability in SDD-0139, need structural redesign",
    reviewer: "Dr. Robert Kim",
  },
];

const decisionColors: Record<Decision, string> = {
  Go: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Conditional Go": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "No-Go": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function confidenceColor(confidence: number): string {
  if (confidence >= 80) return "text-green-600 dark:text-green-400";
  if (confidence >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function confidenceBarColor(confidence: number): string {
  if (confidence >= 80) return "bg-green-500";
  if (confidence >= 60) return "bg-yellow-500";
  return "bg-red-500";
}

const filters = ["All", "Go", "Conditional Go", "No-Go"] as const;

export default function DecisionsPage() {
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filtered =
    activeFilter === "All"
      ? decisions
      : decisions.filter((d) => d.decision === activeFilter);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Decision Reports</h1>
        <p className="text-muted-foreground mt-1">
          Evidence-based go/no-go decisions for pharmacology milestones
        </p>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors",
              activeFilter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Decisions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Program</th>
                  <th className="text-left px-4 py-3 font-medium">Milestone</th>
                  <th className="text-left px-4 py-3 font-medium">Decision</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Confidence</th>
                  <th className="text-left px-4 py-3 font-medium min-w-[300px]">Key Evidence</th>
                  <th className="text-left px-4 py-3 font-medium">Reviewer</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{d.id}</td>
                    <td className="px-4 py-3 font-medium">{d.program}</td>
                    <td className="px-4 py-3">{d.milestone}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          decisionColors[d.decision]
                        )}
                      >
                        {d.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{d.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", confidenceBarColor(d.confidence))}
                            style={{ width: `${d.confidence}%` }}
                          />
                        </div>
                        <span className={cn("text-xs font-medium", confidenceColor(d.confidence))}>
                          {d.confidence}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.keyEvidence}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{d.reviewer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
