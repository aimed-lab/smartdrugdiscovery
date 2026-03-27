"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Cohort {
  id: string;
  name: string;
  disease: string;
  diseaseBadge: string;
  patients: number;
  source: string;
  status: "Recruiting" | "Active" | "Complete";
  digitalTwins: { generated: number; total: number };
  biomarkers: string[];
  dataTypes: string[];
}

const cohorts: Cohort[] = [
  {
    id: "BRAF-MEL-2024",
    name: "BRAF-MEL-2024",
    disease: "Melanoma",
    diseaseBadge: "BRAF V600E+",
    patients: 450,
    source: "UAB Cancer Center",
    status: "Recruiting",
    digitalTwins: { generated: 320, total: 450 },
    biomarkers: ["BRAF V600E", "PD-L1", "TMB"],
    dataTypes: ["Genomics", "Imaging", "Clinical outcomes"],
  },
  {
    id: "TAU-AD-2023",
    name: "TAU-AD-2023",
    disease: "Alzheimer's",
    diseaseBadge: "Early onset",
    patients: 1200,
    source: "ADNI Consortium",
    status: "Active",
    digitalTwins: { generated: 890, total: 1200 },
    biomarkers: ["CSF Tau", "p-Tau", "Amyloid PET"],
    dataTypes: ["PET imaging", "CSF biomarkers", "Cognitive scores", "Genomics"],
  },
  {
    id: "MPN-JAK2-2024",
    name: "MPN-JAK2-2024",
    disease: "MPN",
    diseaseBadge: "JAK2 V617F+",
    patients: 320,
    source: "MD Anderson",
    status: "Recruiting",
    digitalTwins: { generated: 180, total: 320 },
    biomarkers: ["JAK2 V617F allele burden", "CBC"],
    dataTypes: ["Genomics", "Blood panels", "Bone marrow biopsy"],
  },
  {
    id: "NSCLC-RESIST-2025",
    name: "NSCLC-RESIST-2025",
    disease: "NSCLC",
    diseaseBadge: "EGFR resistance",
    patients: 800,
    source: "Multi-site (12 centers)",
    status: "Recruiting",
    digitalTwins: { generated: 250, total: 800 },
    biomarkers: ["EGFR mutations", "ctDNA", "T790M/C797S"],
    dataTypes: ["Genomics", "ctDNA", "Radiology", "Treatment response"],
  },
  {
    id: "SYNTH-MEL-001",
    name: "SYNTH-MEL-001",
    disease: "Synthetic cohort",
    diseaseBadge: "DT-GPT generated",
    patients: 10000,
    source: "DT-GPT generated",
    status: "Complete",
    digitalTwins: { generated: 10000, total: 10000 },
    biomarkers: ["All molecular"],
    dataTypes: ["Simulated genomics", "outcomes", "PK/PD"],
  },
];

const statusColors: Record<string, string> = {
  Recruiting: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Complete: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const diseaseColors: Record<string, string> = {
  Melanoma: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  "Alzheimer's": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  MPN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  NSCLC: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "Synthetic cohort": "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300",
};

const confidenceColor = (pct: number) => {
  if (pct >= 80) return "bg-green-500";
  if (pct >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

export default function CohortsPage() {
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Candidate Cohorts</h1>
        <p className="text-muted-foreground mt-1">
          Patient cohorts, digital twins, and clinical populations
        </p>
      </div>

      {/* Active Cohorts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Active Cohorts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cohorts.map((cohort) => {
            const dtPct = Math.round((cohort.digitalTwins.generated / cohort.digitalTwins.total) * 100);
            return (
              <Card
                key={cohort.id}
                className={cn(
                  "hover:shadow-md transition-shadow cursor-pointer",
                  selectedCohort === cohort.id && "ring-2 ring-primary"
                )}
                onClick={() => setSelectedCohort(selectedCohort === cohort.id ? null : cohort.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg font-mono">{cohort.name}</CardTitle>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                        statusColors[cohort.status]
                      )}
                    >
                      {cohort.status}
                    </span>
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        diseaseColors[cohort.disease] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {cohort.disease}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {cohort.diseaseBadge}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Patient Count & Source */}
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{cohort.patients.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">patients</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{cohort.source}</span>
                  </div>

                  {/* Digital Twin Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Digital Twins</span>
                      <span className="font-medium">
                        {cohort.digitalTwins.generated.toLocaleString()}/{cohort.digitalTwins.total.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className={cn("h-2 rounded-full transition-all", confidenceColor(dtPct))}
                        style={{ width: `${dtPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Biomarkers */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Biomarkers</span>
                    <div className="flex flex-wrap gap-1">
                      {cohort.biomarkers.map((bm) => (
                        <span
                          key={bm}
                          className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium"
                        >
                          {bm}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Data Types */}
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground font-medium">Data Types</span>
                    <div className="flex flex-wrap gap-1">
                      {cohort.dataTypes.map((dt) => (
                        <span
                          key={dt}
                          className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
                        >
                          {dt}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
