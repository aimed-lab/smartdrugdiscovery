"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Decision {
  id: string;
  program: string;
  milestone: string;
  decision: "Go" | "Conditional Go" | "No-Go";
  date: string;
  confidence: number;
  keyEvidence: string;
  reviewer: string;
}

const decisions: Decision[] = [
  {
    id: "DEC-CL-001",
    program: "BRAF Inhibitor",
    milestone: "IND Filing",
    decision: "Go",
    date: "Mar 20, 2026",
    confidence: 92,
    keyEvidence: "Phase II simulation shows PFS benefit, safety acceptable, CDx validated",
    reviewer: "Dr. Amanda Foster",
  },
  {
    id: "DEC-CL-002",
    program: "Alzheimer\u2019s Tau",
    milestone: "FIH Dosing",
    decision: "Conditional Go",
    date: "Mar 15, 2026",
    confidence: 70,
    keyEvidence: "Tau PET biomarker promising but needs larger validation cohort",
    reviewer: "Dr. James Wilson",
  },
  {
    id: "DEC-CL-003",
    program: "JAK2 Inhibitor",
    milestone: "Phase II Design",
    decision: "Go",
    date: "Mar 8, 2026",
    confidence: 80,
    keyEvidence: "Simulation shows feasible SVR35 endpoint, enrollment achievable",
    reviewer: "Dr. Maria Rodriguez",
  },
  {
    id: "DEC-CL-004",
    program: "EGFR Resistance",
    milestone: "Clinical Hold",
    decision: "No-Go",
    date: "Feb 25, 2026",
    confidence: 40,
    keyEvidence: "hERG signal requires preclinical resolution before FIH",
    reviewer: "Dr. Robert Kim",
  },
];

const decisionBadge: Record<string, string> = {
  Go: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Conditional Go": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "No-Go": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const confidenceColor = (value: number) => {
  if (value >= 80) return "bg-green-500";
  if (value >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

export default function DecisionsPage() {
  const [selectedDecision, setSelectedDecision] = useState<string | null>(null);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Decision Reports</h1>
        <p className="text-muted-foreground mt-1">
          Evidence-based go/no-go decisions for clinical development milestones
        </p>
      </div>

      {/* Decisions Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium">ID</th>
              <th className="text-left px-4 py-3 font-medium">Program</th>
              <th className="text-left px-4 py-3 font-medium">Milestone</th>
              <th className="text-left px-4 py-3 font-medium">Decision</th>
              <th className="text-left px-4 py-3 font-medium">Date</th>
              <th className="text-left px-4 py-3 font-medium">Confidence</th>
              <th className="text-left px-4 py-3 font-medium">Key Evidence</th>
              <th className="text-left px-4 py-3 font-medium">Reviewer</th>
            </tr>
          </thead>
          <tbody>
            {decisions.map((dec) => (
              <tr
                key={dec.id}
                className={cn(
                  "border-b last:border-0 hover:bg-muted/30 cursor-pointer",
                  selectedDecision === dec.id && "bg-muted/50"
                )}
                onClick={() => setSelectedDecision(selectedDecision === dec.id ? null : dec.id)}
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{dec.id}</td>
                <td className="px-4 py-3 font-medium">{dec.program}</td>
                <td className="px-4 py-3">{dec.milestone}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      decisionBadge[dec.decision]
                    )}
                  >
                    {dec.decision}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{dec.date}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={cn("h-2 rounded-full transition-all", confidenceColor(dec.confidence))}
                        style={{ width: `${dec.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap">{dec.confidence}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm italic max-w-xs">{dec.keyEvidence}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{dec.reviewer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Go Decisions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {decisions.filter((d) => d.decision === "Go").length}
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                go
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conditional Go</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {decisions.filter((d) => d.decision === "Conditional Go").length}
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                conditional
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>No-Go Decisions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">
                {decisions.filter((d) => d.decision === "No-Go").length}
              </span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                no-go
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
