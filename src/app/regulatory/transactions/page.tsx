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

type Phase = "Discovery" | "Preclinical" | "IND-ready" | "Phase 1" | "Phase 2";
type TxStatus = "In negotiation" | "Active" | "Due diligence" | "Completed" | "Terminated";

interface Valuation {
  program: string;
  phase: Phase;
  valueRange: string;
  method: string;
  pos: number;
  peakSales: string;
  ipSummary: string;
  partners: string;
}

interface Transaction {
  date: string;
  type: string;
  program: string;
  counterparty: string;
  value: string;
  status: TxStatus;
}

const valuations: Valuation[] = [
  {
    program: "BRAF Inhibitor Program",
    phase: "Preclinical",
    valueRange: "$120-180M",
    method: "Risk-adjusted NPV",
    pos: 15,
    peakSales: "$800M",
    ipSummary: "2 patents (1 granted, 1 pending)",
    partners: "Large pharma oncology players",
  },
  {
    program: "Alzheimer's Tau Program",
    phase: "Discovery",
    valueRange: "$40-75M",
    method: "Risk-adjusted NPV",
    pos: 8,
    peakSales: "$2.5B",
    ipSummary: "1 patent pending",
    partners: "Neurology-focused biotechs",
  },
  {
    program: "EGFR-T790M (completed)",
    phase: "IND-ready",
    valueRange: "$250-350M",
    method: "Comparable transactions",
    pos: 22,
    peakSales: "$1.2B",
    ipSummary: "1 granted patent",
    partners: "Lung cancer portfolio builders",
  },
];

const transactions: Transaction[] = [
  {
    date: "Mar 2026",
    type: "Option agreement",
    program: "BRAF",
    counterparty: "Undisclosed pharma",
    value: "$15M upfront + milestones",
    status: "In negotiation",
  },
  {
    date: "Jan 2026",
    type: "Research collaboration",
    program: "Alzheimer's",
    counterparty: "ADNI Consortium",
    value: "In-kind",
    status: "Active",
  },
  {
    date: "Nov 2025",
    type: "Out-licensing inquiry",
    program: "EGFR",
    counterparty: "3 interested parties",
    value: "TBD",
    status: "Due diligence",
  },
];

const phaseColors: Record<Phase, string> = {
  Discovery: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Preclinical: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  "IND-ready": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "Phase 1": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  "Phase 2": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const txStatusColors: Record<TxStatus, string> = {
  "In negotiation": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "Due diligence": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Completed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  Terminated: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

function posColor(pos: number): string {
  if (pos >= 20) return "text-green-600 dark:text-green-400";
  if (pos >= 10) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export default function TransactionsPage() {
  const [_tab] = useState("valuations");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transaction Simulations</h1>
        <p className="text-muted-foreground">
          Deal modeling, IP valuation, and partnership scenario analysis
        </p>
      </div>

      {/* Active Valuations */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Active Valuations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {valuations.map((v) => (
            <Card key={v.program}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{v.program}</CardTitle>
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                      phaseColors[v.phase]
                    )}
                  >
                    {v.phase}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-3xl font-bold">{v.valueRange}</p>
                  <p className="text-sm text-muted-foreground">
                    Estimated value &middot; {v.method}
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Probability of Success</span>
                    <span className={cn("font-bold", posColor(v.pos))}>{v.pos}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Peak Sales Estimate</span>
                    <span className="font-medium">{v.peakSales}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Key IP</span>
                    <span>{v.ipSummary}</span>
                  </div>
                </div>
                <div className="rounded-md bg-muted/50 p-2 text-sm">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Potential Partners</p>
                  <p>{v.partners}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent and ongoing deal activity</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Program</th>
                  <th className="px-4 py-3 text-left font-medium">Counterparty</th>
                  <th className="px-4 py-3 text-left font-medium">Value</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{t.date}</td>
                    <td className="px-4 py-3 font-medium">{t.type}</td>
                    <td className="px-4 py-3">{t.program}</td>
                    <td className="px-4 py-3">{t.counterparty}</td>
                    <td className="px-4 py-3 font-medium">{t.value}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          txStatusColors[t.status]
                        )}
                      >
                        {t.status}
                      </span>
                    </td>
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
