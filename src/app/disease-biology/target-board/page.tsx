"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Target {
  id: string;
  name: string;
  type: "Gene/Protein" | "RNA" | "DNA" | "Cell";
  disease: string;
  druggability: "High" | "Medium" | "Low";
  validation: string;
  evidence: string;
  status: "Active" | "Paused" | "Completed" | "Discovery";
}

const targets: Target[] = [
  { id: "TGT-001", name: "BRAF V600E", type: "Gene/Protein", disease: "Melanoma", druggability: "High", validation: "Clinical", evidence: "Terrain2Drug", status: "Active" },
  { id: "TGT-002", name: "MAPT (Tau)", type: "Gene/Protein", disease: "Alzheimer's", druggability: "Medium", validation: "Preclinical", evidence: "Terrain2Drug", status: "Active" },
  { id: "TGT-003", name: "JAK2 V617F", type: "Gene/Protein", disease: "MPN", druggability: "High", validation: "Clinical", evidence: "Terrain2Drug", status: "Paused" },
  { id: "TGT-004", name: "EGFR T790M", type: "Gene/Protein", disease: "NSCLC", druggability: "High", validation: "Clinical", evidence: "Terrain2Drug", status: "Completed" },
  { id: "TGT-005", name: "miR-21", type: "RNA", disease: "Melanoma", druggability: "Medium", validation: "In vitro", evidence: "Paper2Drug", status: "Active" },
  { id: "TGT-006", name: "MALAT1 lncRNA", type: "RNA", disease: "NSCLC", druggability: "Low", validation: "In vitro", evidence: "Paper2Drug", status: "Discovery" },
  { id: "TGT-007", name: "TERT promoter", type: "DNA", disease: "Melanoma", druggability: "Medium", validation: "Preclinical", evidence: "Terrain2Drug", status: "Active" },
  { id: "TGT-008", name: "BRCA1 methylation", type: "DNA", disease: "Breast Cancer", druggability: "Medium", validation: "Clinical", evidence: "Market2Drug", status: "Active" },
  { id: "TGT-009", name: "CD8+ T cells", type: "Cell", disease: "Melanoma", druggability: "High", validation: "Clinical", evidence: "Market2Drug", status: "Active" },
  { id: "TGT-010", name: "Tumor-assoc. macrophages", type: "Cell", disease: "NSCLC", druggability: "Medium", validation: "Preclinical", evidence: "Terrain2Drug", status: "Discovery" },
];

const filterOptions = ["All", "Gene/Protein", "RNA", "DNA", "Cell"] as const;

const typeBadgeColors: Record<string, string> = {
  "Gene/Protein": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  RNA: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  DNA: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Cell: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const druggabilityColors: Record<string, string> = {
  High: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Low: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusConfig: Record<string, { dot: string; text: string }> = {
  Active: { dot: "bg-green-500", text: "text-green-700 dark:text-green-400" },
  Paused: { dot: "bg-yellow-500", text: "text-yellow-700 dark:text-yellow-400" },
  Completed: { dot: "bg-gray-400", text: "text-gray-600 dark:text-gray-400" },
  Discovery: { dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-400" },
};

const summaryCards = [
  { label: "Total Targets", count: 10, color: "bg-primary text-primary-foreground" },
  { label: "Gene/Protein", count: 4, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  { label: "RNA", count: 2, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  { label: "DNA", count: 2, color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  { label: "Cell", count: 2, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
];

export default function TargetBoardPage() {
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filteredTargets =
    activeFilter === "All"
      ? targets
      : targets.filter((t) => t.type === activeFilter);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Target Board</h1>
        <p className="text-muted-foreground mt-1">
          Gene, RNA, DNA, and cellular targets for disease programs
        </p>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors",
              activeFilter === filter
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Targets Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium">ID</th>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Disease</th>
              <th className="text-left px-4 py-3 font-medium">Druggability</th>
              <th className="text-left px-4 py-3 font-medium">Validation</th>
              <th className="text-left px-4 py-3 font-medium">Evidence</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTargets.map((target) => (
              <tr key={target.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{target.id}</td>
                <td className="px-4 py-3 font-medium">{target.name}</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", typeBadgeColors[target.type])}>
                    {target.type}
                  </span>
                </td>
                <td className="px-4 py-3">{target.disease}</td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", druggabilityColors[target.druggability])}>
                    {target.druggability}
                  </span>
                </td>
                <td className="px-4 py-3">{target.validation}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                    {target.evidence}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", statusConfig[target.status].text)}>
                    <span className={cn("h-2 w-2 rounded-full", statusConfig[target.status].dot)} />
                    {target.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{card.count}</span>
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", card.color)}>
                  {card.label === "Total Targets" ? "all" : card.label.toLowerCase()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
