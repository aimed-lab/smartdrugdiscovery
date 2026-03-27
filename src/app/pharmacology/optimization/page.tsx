"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface OptimizationCampaign {
  id: string;
  title: string;
  models: string[];
  objectives: string[];
  status: "Active" | "Early stage" | "Completed";
  progress: number;
  compoundsTested: number;
  bestCandidate: string;
  bestMetric: string;
}

interface ADMETCategory {
  name: string;
  pass: number;
  total: number;
  note: string;
}

const campaigns: OptimizationCampaign[] = [
  {
    id: "OPT-001",
    title: "BRAF Lead Series Optimization",
    models: ["LFM2-2.6B", "Nach01"],
    objectives: ["Potency", "Selectivity", "Metabolic stability", "Solubility"],
    status: "Active",
    progress: 72,
    compoundsTested: 45,
    bestCandidate: "SDD-0012",
    bestMetric: "IC50 12nM",
  },
  {
    id: "OPT-002",
    title: "JAK2 Selectivity Enhancement",
    models: ["KERMT", "TxGemma"],
    objectives: ["JAK2 selectivity", "CYP clearance", "Oral bioavailability"],
    status: "Active",
    progress: 58,
    compoundsTested: 28,
    bestCandidate: "SDD-0127",
    bestMetric: "5nM, >80x",
  },
  {
    id: "OPT-003",
    title: "Tau Inhibitor BBB Penetration",
    models: ["Nach01"],
    objectives: ["BBB permeability", "CNS exposure", "Tau IC50"],
    status: "Early stage",
    progress: 25,
    compoundsTested: 12,
    bestCandidate: "SDD-0034",
    bestMetric: "45nM, BBB marginal",
  },
  {
    id: "OPT-004",
    title: "EGFR 4th-Gen Resistance",
    models: ["TxGemma", "Agentic-Tx"],
    objectives: ["C797S activity", "Wild-type sparing", "Oral PK"],
    status: "Active",
    progress: 40,
    compoundsTested: 18,
    bestCandidate: "SDD-0139",
    bestMetric: "22nM, hERG flag",
  },
];

const admetCategories: ADMETCategory[] = [
  { name: "Absorption", pass: 8, total: 10, note: "" },
  { name: "Distribution", pass: 7, total: 10, note: "" },
  { name: "Metabolism", pass: 6, total: 10, note: "CYP issues flagged" },
  { name: "Excretion", pass: 9, total: 10, note: "" },
  { name: "Toxicity", pass: 7, total: 10, note: "hERG, phototox flagged" },
  { name: "Synthetic Accessibility", pass: 8, total: 10, note: "" },
];

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Early stage": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

function progressColor(progress: number): string {
  if (progress >= 70) return "bg-green-500";
  if (progress >= 40) return "bg-blue-500";
  return "bg-yellow-500";
}

function admetColor(pass: number, total: number): string {
  const ratio = pass / total;
  if (ratio >= 0.8) return "text-green-600 dark:text-green-400";
  if (ratio >= 0.6) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export default function OptimizationPage() {
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Engineering Optimization</h1>
        <p className="text-muted-foreground mt-1">
          ADMET profiling, multiparameter optimization, and lead refinement
        </p>
      </div>

      {/* Optimization Campaigns */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Optimization Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{campaign.title}</CardTitle>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusColors[campaign.status]
                    )}
                  >
                    {campaign.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Model Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {campaign.models.map((model) => (
                    <span
                      key={model}
                      className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
                    >
                      {model}
                    </span>
                  ))}
                </div>

                {/* Objectives Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {campaign.objectives.map((obj) => (
                    <span
                      key={obj}
                      className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium"
                    >
                      {obj}
                    </span>
                  ))}
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{campaign.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", progressColor(campaign.progress))}
                      style={{ width: `${campaign.progress}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Compounds tested: </span>
                    <span className="font-medium">{campaign.compoundsTested}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Best candidate: </span>
                    <span className="font-medium font-mono">{campaign.bestCandidate}</span>
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Best metric: </span>
                  <span className="font-medium">{campaign.bestMetric}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ADMET Dashboard */}
      <div>
        <h2 className="text-xl font-semibold mb-4">ADMET Dashboard</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {admetCategories.map((cat) => (
            <Card key={cat.name}>
              <CardContent className="pt-6 text-center">
                <div className={cn("text-3xl font-bold", admetColor(cat.pass, cat.total))}>
                  {cat.pass}/{cat.total}
                </div>
                <div className="text-sm font-medium mt-2">{cat.name}</div>
                {cat.note && (
                  <div className="text-xs text-muted-foreground mt-1">{cat.note}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
