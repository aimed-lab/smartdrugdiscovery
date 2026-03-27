"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Decision = "Go" | "Conditional Go" | "No-Go";

interface DecisionRecord {
  id: string;
  program: string;
  milestone: string;
  decision: Decision;
  date: string;
  confidence: number;
  keyEvidence: string;
  reviewer: string;
}

const decisions: DecisionRecord[] = [
  {
    id: "DEC-RG-001",
    program: "BRAF Inhibitor",
    milestone: "Patent filing (7-azaindole)",
    decision: "Go",
    date: "Mar 22, 2026",
    confidence: 95,
    keyEvidence: "Freedom-to-operate confirmed, novel composition claims strong",
    reviewer: "IP Counsel",
  },
  {
    id: "DEC-RG-002",
    program: "Platform",
    milestone: "OSDD2 license adoption",
    decision: "Go",
    date: "Mar 15, 2026",
    confidence: 88,
    keyEvidence: "FAIR compliance achieved for public datasets, commercial protection maintained",
    reviewer: "Dr. Jake Chen",
  },
  {
    id: "DEC-RG-003",
    program: "BRAF Inhibitor",
    milestone: "Partnership deal structure",
    decision: "Conditional Go",
    date: "Mar 10, 2026",
    confidence: 72,
    keyEvidence: "Option deal preferred over full out-license to retain upside",
    reviewer: "Business Dev",
  },
  {
    id: "DEC-RG-004",
    program: "EGFR Resistance",
    milestone: "Out-license timing",
    decision: "Go",
    date: "Feb 28, 2026",
    confidence: 85,
    keyEvidence: "IND-ready package maximizes value, 3 interested parties",
    reviewer: "Business Dev",
  },
  {
    id: "DEC-RG-005",
    program: "Alzheimer's Tau",
    milestone: "Data sharing agreement",
    decision: "Go",
    date: "Feb 15, 2026",
    confidence: 90,
    keyEvidence: "ADNI collaboration under IRB-approved protocol, FAIR-compliant",
    reviewer: "Dr. James Wilson",
  },
];

const decisionColors: Record<Decision, string> = {
  Go: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Conditional Go": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "No-Go": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function confidenceColor(confidence: number): string {
  if (confidence >= 85) return "text-green-600 dark:text-green-400";
  if (confidence >= 70) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export default function DecisionsPage() {
  const [_filter] = useState("All");

  const totalGo = decisions.filter((d) => d.decision === "Go").length;
  const totalConditional = decisions.filter((d) => d.decision === "Conditional Go").length;
  const avgConfidence = Math.round(
    decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length
  );

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Decision Reports</h1>
        <p className="text-muted-foreground">
          Regulatory, IP, and business strategy decisions
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{decisions.length}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Decisions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{totalGo}</div>
            <div className="text-sm text-muted-foreground mt-1">Go Decisions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{totalConditional}</div>
            <div className="text-sm text-muted-foreground mt-1">Conditional</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className={cn("text-3xl font-bold", confidenceColor(avgConfidence))}>{avgConfidence}%</div>
            <div className="text-sm text-muted-foreground mt-1">Avg Confidence</div>
          </CardContent>
        </Card>
      </div>

      {/* Decisions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Regulatory &amp; Business Decisions</CardTitle>
          <CardDescription>Go/No-Go decisions for IP filings, partnerships, and compliance milestones</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">ID</th>
                  <th className="px-4 py-3 text-left font-medium">Program</th>
                  <th className="px-4 py-3 text-left font-medium">Milestone</th>
                  <th className="px-4 py-3 text-left font-medium">Decision</th>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Confidence</th>
                  <th className="px-4 py-3 text-left font-medium">Key Evidence</th>
                  <th className="px-4 py-3 text-left font-medium">Reviewer</th>
                </tr>
              </thead>
              <tbody>
                {decisions.map((d) => (
                  <tr key={d.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{d.id}</td>
                    <td className="px-4 py-3 font-medium">{d.program}</td>
                    <td className="px-4 py-3">{d.milestone}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          decisionColors[d.decision]
                        )}
                      >
                        {d.decision}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.date}</td>
                    <td className="px-4 py-3">
                      <span className={cn("font-bold", confidenceColor(d.confidence))}>
                        {d.confidence}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs">{d.keyEvidence}</td>
                    <td className="px-4 py-3">{d.reviewer}</td>
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
