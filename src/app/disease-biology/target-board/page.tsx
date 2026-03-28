"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Target {
  id: string;
  name: string;
  type: "Gene" | "Protein" | "RNA" | "DNA" | "Cell";
  disease: string;
  druggability: "High" | "Medium" | "Low";
  validation: string;
  evidence: string;
  status: "Active" | "Paused" | "Completed" | "Discovery";
}

const targets: Target[] = [
  { id: "TGT-001", name: "BRAF V600E", type: "Gene", disease: "Melanoma", druggability: "High", validation: "Clinical", evidence: "Terrain2Drug", status: "Active" },
  { id: "TGT-002", name: "MAPT (Tau)", type: "Protein", disease: "Alzheimer's", druggability: "Medium", validation: "Preclinical", evidence: "Terrain2Drug", status: "Active" },
  { id: "TGT-003", name: "JAK2 V617F", type: "Gene", disease: "MPN", druggability: "High", validation: "Clinical", evidence: "Terrain2Drug", status: "Paused" },
  { id: "TGT-004", name: "EGFR T790M", type: "Protein", disease: "NSCLC", druggability: "High", validation: "Clinical", evidence: "Terrain2Drug", status: "Completed" },
  { id: "TGT-005", name: "miR-21", type: "RNA", disease: "Melanoma", druggability: "Medium", validation: "In vitro", evidence: "Paper2Drug", status: "Active" },
  { id: "TGT-006", name: "MALAT1 lncRNA", type: "RNA", disease: "NSCLC", druggability: "Low", validation: "In vitro", evidence: "Paper2Drug", status: "Discovery" },
  { id: "TGT-007", name: "TERT promoter", type: "DNA", disease: "Melanoma", druggability: "Medium", validation: "Preclinical", evidence: "Terrain2Drug", status: "Active" },
  { id: "TGT-008", name: "BRCA1 methylation", type: "DNA", disease: "Breast Cancer", druggability: "Medium", validation: "Clinical", evidence: "Market2Drug", status: "Active" },
  { id: "TGT-009", name: "CD8+ T cells", type: "Cell", disease: "Melanoma", druggability: "High", validation: "Clinical", evidence: "Market2Drug", status: "Active" },
  { id: "TGT-010", name: "Tumor-assoc. macrophages", type: "Cell", disease: "NSCLC", druggability: "Medium", validation: "Preclinical", evidence: "Terrain2Drug", status: "Discovery" },
];

const filterOptions = ["All", "Gene", "Protein", "RNA", "DNA", "Cell"] as const;

const typeBadgeColors: Record<string, string> = {
  Gene:    "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  Protein: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  RNA:     "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  DNA:     "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Cell:    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

// Slightly more saturated version for the summary tiles
const tileBg: Record<string, string> = {
  Gene:    "bg-sky-100/80 dark:bg-sky-900/40 border border-sky-200 dark:border-sky-800",
  Protein: "bg-blue-100/80 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800",
  RNA:     "bg-purple-100/80 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800",
  DNA:     "bg-orange-100/80 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-800",
  Cell:    "bg-green-100/80 dark:bg-green-900/40 border border-green-200 dark:border-green-800",
};

const tileText: Record<string, string> = {
  Gene:    "text-sky-700 dark:text-sky-300",
  Protein: "text-blue-700 dark:text-blue-300",
  RNA:     "text-purple-700 dark:text-purple-300",
  DNA:     "text-orange-700 dark:text-orange-300",
  Cell:    "text-green-700 dark:text-green-300",
};

const druggabilityColors: Record<string, string> = {
  High:   "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Low:    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusConfig: Record<string, { dot: string; text: string }> = {
  Active:    { dot: "bg-green-500",  text: "text-green-700 dark:text-green-400" },
  Paused:    { dot: "bg-yellow-500", text: "text-yellow-700 dark:text-yellow-400" },
  Completed: { dot: "bg-gray-400",   text: "text-gray-600 dark:text-gray-400" },
  Discovery: { dot: "bg-blue-500",   text: "text-blue-700 dark:text-blue-400" },
};

const subtypes = ["Gene", "Protein", "RNA", "DNA", "Cell"] as const;

export default function TargetBoardPage() {
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filteredTargets =
    activeFilter === "All"
      ? targets
      : targets.filter((t) => t.type === activeFilter);

  const counts = Object.fromEntries(
    subtypes.map((type) => [type, targets.filter((t) => t.type === type).length])
  );

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Target Board</h1>
        <p className="text-muted-foreground mt-1">
          Gene, protein, RNA, DNA, and cellular targets for disease programs
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
        <table className="w-full text-sm min-w-[640px]">
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

      {/* Summary — large total + shaded subcategory tiles */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Total — large and dominant */}
          <div className="shrink-0 flex flex-col items-start sm:pr-6 sm:border-r">
            <span className="text-5xl font-extrabold leading-none">{targets.length}</span>
            <span className="text-sm text-muted-foreground mt-1 font-medium">Targets</span>
          </div>

          {/* Subcategory shaded tiles */}
          <div className="flex flex-wrap gap-3 flex-1">
            {subtypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter(activeFilter === type ? "All" : type)}
                className={cn(
                  "flex flex-col items-center rounded-lg px-4 py-2.5 min-w-[72px] transition-all",
                  tileBg[type],
                  activeFilter === type && "ring-2 ring-offset-1 ring-current"
                )}
              >
                <span className={cn("text-2xl font-bold leading-none", tileText[type])}>
                  {counts[type]}
                </span>
                <span className={cn("text-xs font-medium mt-0.5", tileText[type])}>
                  {type}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
