"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MoAStudy {
  id: string;
  title: string;
  pathway: string;
  method: string;
  status: "Validated" | "Under review" | "Investigating";
  confidence: number;
  evidence: string;
}

interface EvidenceStream {
  name: string;
  description: string;
  analysisCount: number;
  type: "network" | "clinical" | "literature";
}

const moaStudies: MoAStudy[] = [
  {
    id: "MOA-001",
    title: "BRAF V600E \u2192 MEK \u2192 ERK Cascade",
    pathway: "MAPK/ERK",
    method: "GeneTerrain + PETS",
    status: "Validated",
    confidence: 92,
    evidence: "GTKM shows concentrated expression in melanoma tumor microenvironment",
  },
  {
    id: "MOA-002",
    title: "Tau Phosphorylation via GSK-3\u03B2",
    pathway: "Wnt/GSK3",
    method: "Network propagation",
    status: "Under review",
    confidence: 78,
    evidence: "scRNA-seq from ADNI cohort shows GSK-3\u03B2 upregulation in neuronal subtypes",
  },
  {
    id: "MOA-003",
    title: "JAK2-STAT Signaling in MPN",
    pathway: "JAK-STAT",
    method: "Perturb-seq analysis",
    status: "Validated",
    confidence: 88,
    evidence: "CPA model predicts restoration of normal hematopoiesis upon JAK2 inhibition",
  },
  {
    id: "MOA-004",
    title: "EGFR \u2192 PI3K \u2192 AKT Resistance",
    pathway: "PI3K/AKT/mTOR",
    method: "GeneTerrain + BioReason-Pro",
    status: "Investigating",
    confidence: 65,
    evidence: "Resistance mechanism identified through multi-agent LLM analysis",
  },
];

const evidenceStreams: EvidenceStream[] = [
  { name: "Terrain2Drug", description: "Network-based target discovery from GeneTerrain Knowledge Maps", analysisCount: 12, type: "network" },
  { name: "Market2Drug", description: "Clinical and market data-driven drug repurposing insights", analysisCount: 8, type: "clinical" },
  { name: "Paper2Drug", description: "Literature mining and NLP-based evidence extraction", analysisCount: 15, type: "literature" },
];

const statusColors: Record<string, string> = {
  Validated: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "Under review": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Investigating: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
};

const confidenceColor = (value: number) => {
  if (value >= 80) return "bg-green-500";
  if (value >= 60) return "bg-yellow-500";
  return "bg-red-500";
};

const streamColors: Record<string, string> = {
  network: "bg-primary/10 text-primary",
  clinical: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  literature: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export default function MechanismsPage() {
  const [selectedStudy, setSelectedStudy] = useState<string | null>(null);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mechanisms of Action</h1>
        <p className="text-muted-foreground mt-1">
          Pathway analysis, network pharmacology, and MoA validation
        </p>
      </div>

      {/* Active MoA Studies */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Active MoA Studies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {moaStudies.map((study) => (
            <Card
              key={study.id}
              className={cn(
                "hover:shadow-md transition-shadow cursor-pointer",
                selectedStudy === study.id && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedStudy(selectedStudy === study.id ? null : study.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{study.title}</CardTitle>
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", statusColors[study.status])}>
                    {study.status}
                  </span>
                </div>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                    {study.pathway}
                  </span>
                  <span className="text-xs text-muted-foreground">{study.method}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Confidence Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-medium">{study.confidence}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className={cn("h-2 rounded-full transition-all", confidenceColor(study.confidence))}
                      style={{ width: `${study.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Evidence */}
                <div className="text-sm">
                  <span className="text-muted-foreground">Evidence: </span>
                  <span className="italic">{study.evidence}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Evidence Streams */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Evidence Streams</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {evidenceStreams.map((stream) => (
            <Card key={stream.name} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{stream.name}</CardTitle>
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", streamColors[stream.type])}>
                    {stream.type}
                  </span>
                </div>
                <CardDescription>{stream.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{stream.analysisCount}</span>
                  <span className="text-sm text-muted-foreground">analyses</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
