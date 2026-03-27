"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Stage = "Hit" | "Lead" | "Preclinical" | "Approved";

interface Compound {
  id: string;
  name: string;
  program: string;
  stage: Stage;
  mw: string;
  logP: string;
  target: string;
  ic50: string;
  selectivity: string;
  admetFlag: string;
}

const compounds: Compound[] = [
  { id: "SDD-0012", name: "Vemurafenib analog", program: "BRAF", stage: "Lead", mw: "510.4", logP: "3.6", target: "BRAF V600E", ic50: "12 nM", selectivity: ">100x", admetFlag: "Phototoxicity" },
  { id: "SDD-0034", name: "Tau-Phos-1", program: "Alzheimer's", stage: "Hit", mw: "385.2", logP: "2.1", target: "GSK-3\u03B2", ic50: "45 nM", selectivity: "15x", admetFlag: "Clean" },
  { id: "SDD-0056", name: "JAK2-Sel-7", program: "JAK2", stage: "Lead", mw: "442.8", logP: "2.8", target: "JAK2", ic50: "8 nM", selectivity: ">50x", admetFlag: "CYP2D6" },
  { id: "SDD-0078", name: "Osimertinib-R", program: "EGFR", stage: "Preclinical", mw: "499.6", logP: "3.2", target: "EGFR T790M", ic50: "3 nM", selectivity: ">200x", admetFlag: "Clean" },
  { id: "SDD-0089", name: "BRAF-Aza-3", program: "BRAF", stage: "Hit", mw: "465.3", logP: "3.1", target: "BRAF V600E", ic50: "8 nM", selectivity: "85x", admetFlag: "Clean" },
  { id: "SDD-0102", name: "Tau-Frag-12", program: "Alzheimer's", stage: "Hit", mw: "298.4", logP: "1.8", target: "Tau aggregation", ic50: "120 nM", selectivity: "N/A", admetFlag: "BBB low" },
  { id: "SDD-0115", name: "TAU-ASO-1", program: "Alzheimer's", stage: "Hit", mw: "N/A", logP: "N/A", target: "MAPT mRNA", ic50: "IC50 N/A", selectivity: "N/A", admetFlag: "Delivery" },
  { id: "SDD-0127", name: "JAK2-Opt-2", program: "JAK2", stage: "Lead", mw: "458.1", logP: "2.5", target: "JAK2", ic50: "5 nM", selectivity: ">80x", admetFlag: "Clean" },
  { id: "SDD-0139", name: "EGFR-4G-1", program: "EGFR", stage: "Hit", mw: "525.7", logP: "3.8", target: "EGFR C797S", ic50: "22 nM", selectivity: "40x", admetFlag: "hERG moderate" },
  { id: "SDD-0151", name: "RAS-pep-1", program: "KRAS", stage: "Hit", mw: "1850", logP: "N/A", target: "KRAS G12C", ic50: "180 nM", selectivity: "12x", admetFlag: "Stability" },
];

const stageColors: Record<Stage, string> = {
  Hit: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  Lead: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Preclinical: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  Approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const filters = ["All", "Hits", "Leads", "Preclinical Candidates", "Approved"] as const;

const filterToStage: Record<string, Stage | null> = {
  All: null,
  Hits: "Hit",
  Leads: "Lead",
  "Preclinical Candidates": "Preclinical",
  Approved: "Approved",
};

export default function CandidatesPage() {
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filtered =
    activeFilter === "All"
      ? compounds
      : compounds.filter((c) => c.stage === filterToStage[activeFilter]);

  const totalHits = compounds.filter((c) => c.stage === "Hit").length;
  const totalLeads = compounds.filter((c) => c.stage === "Lead").length;
  const totalPreclinical = compounds.filter((c) => c.stage === "Preclinical").length;

  const summaryCards = [
    { label: "Total", value: compounds.length, color: "text-foreground" },
    { label: "Hits", value: totalHits, color: "text-gray-600 dark:text-gray-400" },
    { label: "Leads", value: totalLeads, color: "text-blue-600 dark:text-blue-400" },
    { label: "Preclinical", value: totalPreclinical, color: "text-indigo-600 dark:text-indigo-400" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Candidate Molecules</h1>
        <p className="text-muted-foreground mt-1">
          Lead compounds, hit series, and molecular libraries
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className={cn("text-3xl font-bold", s.color)}>{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
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

      {/* Compounds Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">ID</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Program</th>
                  <th className="text-left px-4 py-3 font-medium">Stage</th>
                  <th className="text-left px-4 py-3 font-medium">MW</th>
                  <th className="text-left px-4 py-3 font-medium">LogP</th>
                  <th className="text-left px-4 py-3 font-medium">Target</th>
                  <th className="text-left px-4 py-3 font-medium">IC50</th>
                  <th className="text-left px-4 py-3 font-medium">Selectivity</th>
                  <th className="text-left px-4 py-3 font-medium">ADMET Flag</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{c.id}</td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.program}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          stageColors[c.stage]
                        )}
                      >
                        {c.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3">{c.mw}</td>
                    <td className="px-4 py-3">{c.logP}</td>
                    <td className="px-4 py-3">{c.target}</td>
                    <td className="px-4 py-3">{c.ic50}</td>
                    <td className="px-4 py-3">{c.selectivity}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          c.admetFlag === "Clean"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                        )}
                      >
                        {c.admetFlag}
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
