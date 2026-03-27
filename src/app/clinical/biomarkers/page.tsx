"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Biomarker {
  name: string;
  type: string;
  program: string;
  sensitivity: string;
  specificity: string;
  assayPlatform: string;
  status: "Validated" | "In validation" | "Exploratory";
  cdxPotential: "High" | "Medium" | "Low";
  cdxNote: string;
}

const biomarkers: Biomarker[] = [
  {
    name: "BRAF V600E mutation",
    type: "Genomic",
    program: "BRAF Inhibitor",
    sensitivity: "98%",
    specificity: "99%",
    assayPlatform: "PCR/NGS",
    status: "Validated",
    cdxPotential: "High",
    cdxNote: "FDA precedent",
  },
  {
    name: "PD-L1 (TPS \u226550%)",
    type: "Protein",
    program: "BRAF + IO combo",
    sensitivity: "72%",
    specificity: "68%",
    assayPlatform: "IHC (22C3)",
    status: "Validated",
    cdxPotential: "High",
    cdxNote: "existing CDx",
  },
  {
    name: "Tau PET (flortaucipir)",
    type: "Imaging",
    program: "Alzheimer\u2019s Tau",
    sensitivity: "85%",
    specificity: "78%",
    assayPlatform: "PET scan",
    status: "In validation",
    cdxPotential: "Medium",
    cdxNote: "cost concerns",
  },
  {
    name: "CSF p-Tau/A\u03B242 ratio",
    type: "Fluid",
    program: "Alzheimer\u2019s Tau",
    sensitivity: "90%",
    specificity: "82%",
    assayPlatform: "Immunoassay",
    status: "Validated",
    cdxPotential: "High",
    cdxNote: "emerging",
  },
  {
    name: "JAK2 V617F allele burden",
    type: "Genomic",
    program: "JAK2 Inhibitor",
    sensitivity: "95%",
    specificity: "97%",
    assayPlatform: "qPCR",
    status: "Validated",
    cdxPotential: "High",
    cdxNote: "standard",
  },
  {
    name: "ctDNA EGFR T790M",
    type: "Liquid biopsy",
    program: "EGFR Resistance",
    sensitivity: "88%",
    specificity: "92%",
    assayPlatform: "ddPCR/NGS",
    status: "Validated",
    cdxPotential: "High",
    cdxNote: "FDA approved",
  },
  {
    name: "TMB (\u226510 mut/Mb)",
    type: "Genomic",
    program: "Cross-program",
    sensitivity: "65%",
    specificity: "70%",
    assayPlatform: "WES/Panel",
    status: "Exploratory",
    cdxPotential: "Medium",
    cdxNote: "",
  },
  {
    name: "CD8+ TIL density",
    type: "Histology",
    program: "BRAF + IO",
    sensitivity: "75%",
    specificity: "72%",
    assayPlatform: "mIHC/IF",
    status: "Exploratory",
    cdxPotential: "Low",
    cdxNote: "research only",
  },
];

const statusColors: Record<string, string> = {
  Validated: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "In validation": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Exploratory: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

const cdxColors: Record<string, string> = {
  High: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const filterOptions = ["All", "Validated", "In validation", "Exploratory"] as const;

const validatedCount = biomarkers.filter((b) => b.status === "Validated").length;
const inValidationCount = biomarkers.filter((b) => b.status === "In validation").length;
const exploratoryCount = biomarkers.filter((b) => b.status === "Exploratory").length;
const highCdxCount = biomarkers.filter((b) => b.cdxPotential === "High").length;

export default function BiomarkersPage() {
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filtered =
    activeFilter === "All"
      ? biomarkers
      : biomarkers.filter((b) => b.status === activeFilter);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Companion Biomarker Optimization</h1>
        <p className="text-muted-foreground mt-1">
          Biomarker discovery, validation, and companion diagnostic development
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

      {/* Biomarkers Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-medium">Biomarker</th>
              <th className="text-left px-4 py-3 font-medium">Type</th>
              <th className="text-left px-4 py-3 font-medium">Program</th>
              <th className="text-left px-4 py-3 font-medium">Sensitivity</th>
              <th className="text-left px-4 py-3 font-medium">Specificity</th>
              <th className="text-left px-4 py-3 font-medium">Assay Platform</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">CDx Potential</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((bm) => (
              <tr key={bm.name} className="border-b last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{bm.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                    {bm.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{bm.program}</td>
                <td className="px-4 py-3 font-mono">{bm.sensitivity}</td>
                <td className="px-4 py-3 font-mono">{bm.specificity}</td>
                <td className="px-4 py-3 text-muted-foreground">{bm.assayPlatform}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusColors[bm.status]
                    )}
                  >
                    {bm.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        cdxColors[bm.cdxPotential]
                      )}
                    >
                      {bm.cdxPotential}
                    </span>
                    {bm.cdxNote && (
                      <span className="text-xs text-muted-foreground">- {bm.cdxNote}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Validated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{validatedCount}</span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                validated
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Validation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{inValidationCount}</span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                in validation
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Exploratory</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{exploratoryCount}</span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                exploratory
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>High CDx Potential</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{highCdxCount}</span>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                high CDx
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
