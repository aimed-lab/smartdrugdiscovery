"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DecisionReport {
  id: string;
  program: string;
  milestone: string;
  decision: "Go" | "Conditional Go" | "No-Go";
  date: string;
  confidence: number;
  keyEvidence: string;
  reviewer: string;
}

const decisions: DecisionReport[] = [
  {
    id: "DEC-DB-001",
    program: "BRAF Inhibitor",
    milestone: "Target Validation",
    decision: "Go",
    date: "Mar 15, 2026",
    confidence: 95,
    keyEvidence: "GTKM + clinical genomics confirm BRAF V600E as primary driver",
    reviewer: "Dr. Sarah Chen",
  },
  {
    id: "DEC-DB-002",
    program: "Alzheimer\u2019s Tau",
    milestone: "Target Selection",
    decision: "Conditional Go",
    date: "Mar 10, 2026",
    confidence: 72,
    keyEvidence: "GSK-3\u03B2 shows promise but tau PET signal needs validation",
    reviewer: "Dr. James Wilson",
  },
  {
    id: "DEC-DB-003",
    program: "JAK2 Inhibitor",
    milestone: "MoA Confirmation",
    decision: "Go",
    date: "Feb 28, 2026",
    confidence: 88,
    keyEvidence: "Perturb-seq confirms selective JAK2/STAT pathway modulation",
    reviewer: "Dr. Maria Rodriguez",
  },
  {
    id: "DEC-DB-004",
    program: "EGFR Resistance",
    milestone: "Resistance Mechanism",
    decision: "Go",
    date: "Feb 15, 2026",
    confidence: 91,
    keyEvidence: "C797S mutation confirmed as primary resistance driver",
    reviewer: "Dr. Robert Kim",
  },
  {
    id: "DEC-DB-005",
    program: "miR-21 Program",
    milestone: "Target Feasibility",
    decision: "No-Go",
    date: "Jan 30, 2026",
    confidence: 45,
    keyEvidence: "Delivery challenges and off-target effects in PETS simulation",
    reviewer: "Dr. Wei Zhang",
  },
];

const decisionColors: Record<string, string> = {
  Go: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Conditional Go": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  "No-Go": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const confidenceBarColor = (value: number) => {
  if (value >= 80) return "bg-green-500";
  if (value >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

const goCount = decisions.filter((d) => d.decision === "Go").length;
const conditionalCount = decisions.filter((d) => d.decision === "Conditional Go").length;
const noGoCount = decisions.filter((d) => d.decision === "No-Go").length;

export default function DecisionsPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Decision Reports</h1>
        <p className="text-muted-foreground mt-1">
          Evidence-based go/no-go decisions for disease biology milestones
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <span className="text-green-700 dark:text-green-300 text-lg font-bold">{goCount}</span>
              </div>
              <div>
                <p className="text-sm font-medium">Go</p>
                <p className="text-xs text-muted-foreground">Approved to proceed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <span className="text-yellow-700 dark:text-yellow-300 text-lg font-bold">{conditionalCount}</span>
              </div>
              <div>
                <p className="text-sm font-medium">Conditional Go</p>
                <p className="text-xs text-muted-foreground">Pending additional data</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <span className="text-red-700 dark:text-red-300 text-lg font-bold">{noGoCount}</span>
              </div>
              <div>
                <p className="text-sm font-medium">No-Go</p>
                <p className="text-xs text-muted-foreground">Program halted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decision Reports Table */}
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
                className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                onClick={() => setExpandedRow(expandedRow === dec.id ? null : dec.id)}
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{dec.id}</td>
                <td className="px-4 py-3 font-medium">{dec.program}</td>
                <td className="px-4 py-3">{dec.milestone}</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", decisionColors[dec.decision])}>
                    {dec.decision}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{dec.date}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="h-2 w-full max-w-[80px] rounded-full bg-muted">
                      <div
                        className={cn("h-2 rounded-full transition-all", confidenceBarColor(dec.confidence))}
                        style={{ width: `${dec.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{dec.confidence}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <span className="text-xs italic">{dec.keyEvidence}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{dec.reviewer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
