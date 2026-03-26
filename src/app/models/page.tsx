"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useState } from "react";

// ---------------------------------------------------------------------------
// A1-A10 Model Hierarchy
// ---------------------------------------------------------------------------

interface ModelLevel {
  id: string;
  name: string;
  scale: string;
  description: string;
  examples: string[];
  evidenceStreams: string[];
}

const modelLevels: ModelLevel[] = [
  {
    id: "A1",
    name: "Gene/Protein Target",
    scale: "Molecular",
    description:
      "Identification of potential targets using deep learning-based screening and network pharmacology",
    examples: ["Omics studies", "Structural bioinformatics", "Target deconvolution"],
    evidenceStreams: ["Terrain2Drug"],
  },
  {
    id: "A2",
    name: "Pathway & Gene Signature (PAG)",
    scale: "Molecular",
    description:
      "Detailed target profile mapping involvement in biochemical pathways and regulatory networks",
    examples: ["Pathway perturbation", "Gene signatures", "Regulatory data"],
    evidenceStreams: ["Terrain2Drug"],
  },
  {
    id: "A3",
    name: "Network for Target",
    scale: "Molecular",
    description:
      "Target embedded in protein-protein interaction networks, identifying compensatory mechanisms and off-target risks",
    examples: ["PPI networks", "GeneTerrain Knowledge Map", "Network pharmacology"],
    evidenceStreams: ["Terrain2Drug"],
  },
  {
    id: "A4",
    name: "Whole Cell",
    scale: "Cellular",
    description:
      "AI-driven predictions of how candidates modulate cellular phenotypes using multi-omics data",
    examples: ["Transcriptomics", "Proteomics", "Metabolomics", "iPSCs", "CM4AI data"],
    evidenceStreams: ["Terrain2Drug"],
  },
  {
    id: "A5",
    name: "Whole Tissue",
    scale: "Tissue",
    description:
      "Spatial transcriptomics and imaging to understand drug effects on complex tissue architecture",
    examples: [
      "Spatial transcriptomics",
      "scRNA-seq",
      "Microfluidic platforms",
      "Tumor microenvironment",
    ],
    evidenceStreams: ["Terrain2Drug", "Market2Drug"],
  },
  {
    id: "A6",
    name: "Whole Organ",
    scale: "Organ",
    description:
      "Organ-level assessment using organoids and microphysiological systems for distribution, metabolism, and toxicity",
    examples: [
      "Organoids",
      "Organ-on-chip",
      "Cell-cell communication",
      "Blood biomarkers",
    ],
    evidenceStreams: ["Terrain2Drug", "Market2Drug"],
  },
  {
    id: "A7",
    name: "Human Patient",
    scale: "Individual",
    description:
      "Individual-level data integration for predicting drug behavior and adverse responses in humans",
    examples: [
      "Digital twins",
      "Comorbidity modeling",
      "Mental health",
      "Socioeconomic factors",
    ],
    evidenceStreams: ["Market2Drug", "Paper2Drug"],
  },
  {
    id: "A8",
    name: "Patient Cohort",
    scale: "Cohort",
    description:
      "Cohort-level predictions for efficacy, safety, resistance using contrastive learning and survival modeling",
    examples: [
      "Synthetic patients",
      "Survival analysis",
      "Patient stratification",
      "Dosing optimization",
    ],
    evidenceStreams: ["Market2Drug", "Paper2Drug"],
  },
  {
    id: "A9",
    name: "Disease Population",
    scale: "Population",
    description:
      "Geographically diverse cohort analysis capturing genetic, environmental, and socioeconomic heterogeneity",
    examples: [
      "Real-world evidence",
      "Electronic health records",
      "Epidemiological analysis",
    ],
    evidenceStreams: ["Market2Drug", "Paper2Drug"],
  },
  {
    id: "A10",
    name: "Whole Population",
    scale: "Society",
    description:
      "Population health evaluation integrating comorbid conditions, long-term outcomes, and public health impact",
    examples: [
      "Multi-disease modeling",
      "EHR integration",
      "Public health impact",
      "Off-target surveillance",
    ],
    evidenceStreams: ["Market2Drug", "Paper2Drug"],
  },
];

const colorMap: Record<string, string> = {
  A1: "bg-blue-600",
  A2: "bg-blue-500",
  A3: "bg-blue-400",
  A4: "bg-indigo-500",
  A5: "bg-violet-500",
  A6: "bg-purple-500",
  A7: "bg-fuchsia-500",
  A8: "bg-pink-500",
  A9: "bg-emerald-500",
  A10: "bg-green-600",
};

const scaleColors: Record<string, string> = {
  Molecular: "bg-blue-100 text-blue-800",
  Cellular: "bg-indigo-100 text-indigo-800",
  Tissue: "bg-violet-100 text-violet-800",
  Organ: "bg-purple-100 text-purple-800",
  Individual: "bg-pink-100 text-pink-800",
  Cohort: "bg-rose-100 text-rose-800",
  Population: "bg-orange-100 text-orange-800",
  Society: "bg-red-100 text-red-800",
};

const evidenceStreamColors: Record<string, string> = {
  Terrain2Drug: "bg-blue-100 text-blue-800",
  Market2Drug: "bg-green-100 text-green-800",
  Paper2Drug: "bg-amber-100 text-amber-800",
  Gene2Drug: "bg-purple-100 text-purple-800",
};

// ---------------------------------------------------------------------------
// Compound Validation Matrix
// ---------------------------------------------------------------------------

interface CompoundValidation {
  compound: string;
  id: string;
  validations: Record<string, "pass" | "fail" | "warning" | "pending">;
  decision: "go" | "no-go" | "conditional";
}

const compoundValidations: CompoundValidation[] = [
  {
    compound: "Vemurafenib",
    id: "SDD-0012",
    validations: {
      A1: "pass",
      A2: "pass",
      A3: "pass",
      A4: "pass",
      A5: "warning",
      A6: "warning",
      A7: "pass",
      A8: "pending",
      A9: "pending",
      A10: "pending",
    },
    decision: "conditional",
  },
  {
    compound: "Erlotinib",
    id: "SDD-0034",
    validations: {
      A1: "pass",
      A2: "pass",
      A3: "pass",
      A4: "pass",
      A5: "pass",
      A6: "pass",
      A7: "pass",
      A8: "pass",
      A9: "warning",
      A10: "pending",
    },
    decision: "go",
  },
  {
    compound: "Imatinib",
    id: "SDD-0056",
    validations: {
      A1: "pass",
      A2: "pass",
      A3: "pass",
      A4: "pass",
      A5: "pass",
      A6: "pass",
      A7: "pass",
      A8: "pass",
      A9: "pass",
      A10: "pass",
    },
    decision: "go",
  },
  {
    compound: "Sorafenib",
    id: "SDD-0078",
    validations: {
      A1: "pass",
      A2: "pass",
      A3: "warning",
      A4: "warning",
      A5: "fail",
      A6: "pending",
      A7: "pending",
      A8: "pending",
      A9: "pending",
      A10: "pending",
    },
    decision: "no-go",
  },
  {
    compound: "Candidate-X",
    id: "SDD-0200",
    validations: {
      A1: "pass",
      A2: "pass",
      A3: "pass",
      A4: "warning",
      A5: "pending",
      A6: "pending",
      A7: "pending",
      A8: "pending",
      A9: "pending",
      A10: "pending",
    },
    decision: "conditional",
  },
];

const statusColors: Record<string, string> = {
  pass: "bg-green-500",
  fail: "bg-red-500",
  warning: "bg-yellow-500",
  pending: "bg-gray-300",
};

const decisionBadge: Record<string, string> = {
  go: "bg-green-100 text-green-800",
  "no-go": "bg-red-100 text-red-800",
  conditional: "bg-yellow-100 text-yellow-800",
};

// ---------------------------------------------------------------------------
// Evidence Stream definitions
// ---------------------------------------------------------------------------

interface EvidenceStream {
  name: string;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
  coverage: string[];
  capabilities: string[];
}

const evidenceStreams: EvidenceStream[] = [
  {
    name: "Terrain2Drug",
    color: "text-blue-700",
    borderColor: "border-l-blue-500",
    bgColor: "bg-blue-50",
    description:
      "Molecular and network-based evidence leveraging GTKM-like models and network pharmacology. Covers A1-A6.",
    coverage: ["A1", "A2", "A3", "A4", "A5", "A6"],
    capabilities: [
      "Target identification",
      "Pathway analysis",
      "Network vulnerability",
      "Cellular phenotype prediction",
      "Tissue-level spatial analysis",
      "Organ-level distribution",
    ],
  },
  {
    name: "Market2Drug",
    color: "text-green-700",
    borderColor: "border-l-green-500",
    bgColor: "bg-green-50",
    description:
      "Clinical and epidemiological evidence from patient data and real-world evidence. Covers A5-A10.",
    coverage: ["A5", "A6", "A7", "A8", "A9", "A10"],
    capabilities: [
      "Clinical trial data synthesis",
      "Patient stratification",
      "Cohort-level safety",
      "Geographic heterogeneity",
      "Population health modeling",
    ],
  },
  {
    name: "Paper2Drug",
    color: "text-amber-700",
    borderColor: "border-l-amber-500",
    bgColor: "bg-amber-50",
    description:
      "Systematic evidence mining from scientific literature using NLP and ML. Covers A7-A10.",
    coverage: ["A7", "A8", "A9", "A10"],
    capabilities: [
      "Literature mining",
      "Citation network analysis",
      "Competitor intelligence",
      "Mechanism extraction",
      "Evidence aggregation",
    ],
  },
  {
    name: "Gene2Drug",
    color: "text-purple-700",
    borderColor: "border-l-purple-500",
    bgColor: "bg-purple-50",
    description:
      "Gene-level evidence linking genetic targets to drug candidates through computational screening. Covers A1-A3.",
    coverage: ["A1", "A2", "A3"],
    capabilities: [
      "Genetic target prioritization",
      "Computational screening",
      "Variant-to-function mapping",
      "Druggability assessment",
      "Gene-disease association",
    ],
  },
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ModelsPage() {
  const [selectedLevel, setSelectedLevel] = useState<ModelLevel>(modelLevels[0]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Models</h1>
        <p className="text-muted-foreground mt-1">
          AIDD 2.0 multi-scale validation hierarchy (A1–A10)
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="hierarchy" className="w-full">
        <TabsList>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="validation">Validation Matrix</TabsTrigger>
          <TabsTrigger value="evidence">Evidence Streams</TabsTrigger>
        </TabsList>

        {/* ----------------------------------------------------------------- */}
        {/* Hierarchy Tab                                                      */}
        {/* ----------------------------------------------------------------- */}
        <TabsContent value="hierarchy" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left — vertical pipeline */}
            <div className="lg:col-span-2 space-y-0">
              {modelLevels.map((level, idx) => (
                <div key={level.id}>
                  {/* Node card */}
                  <Card
                    className={cn(
                      "cursor-pointer transition-shadow hover:shadow-md",
                      selectedLevel.id === level.id &&
                        "ring-2 ring-primary shadow-md"
                    )}
                    onClick={() => setSelectedLevel(level)}
                  >
                    <CardHeader className="flex flex-row items-start gap-4 pb-2">
                      {/* Badge */}
                      <div
                        className={cn(
                          "h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white",
                          colorMap[level.id]
                        )}
                      >
                        {level.id}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">
                            {level.name}
                          </CardTitle>
                          <span
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              scaleColors[level.scale]
                            )}
                          >
                            {level.scale}
                          </span>
                        </div>
                        <CardDescription className="mt-1">
                          {level.description}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 pl-20">
                      {/* Examples */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {level.examples.map((ex) => (
                          <span
                            key={ex}
                            className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded"
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                      {/* Evidence streams */}
                      <div className="flex flex-wrap gap-1.5">
                        {level.evidenceStreams.map((es) => (
                          <span
                            key={es}
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              evidenceStreamColors[es]
                            )}
                          >
                            {es}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Connector line */}
                  {idx < modelLevels.length - 1 && (
                    <div className="w-0.5 h-6 bg-border mx-auto" />
                  )}
                </div>
              ))}
            </div>

            {/* Right — detail panel */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-12 w-12 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white",
                          colorMap[selectedLevel.id]
                        )}
                      >
                        {selectedLevel.id}
                      </div>
                      <div>
                        <CardTitle>{selectedLevel.name}</CardTitle>
                        <span
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block",
                            scaleColors[selectedLevel.scale]
                          )}
                        >
                          {selectedLevel.scale}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Description
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedLevel.description}
                      </p>
                    </div>

                    {/* Examples */}
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Key Examples
                      </h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
                        {selectedLevel.examples.map((ex) => (
                          <li key={ex}>{ex}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Evidence Streams */}
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Evidence Streams
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedLevel.evidenceStreams.map((es) => (
                          <span
                            key={es}
                            className={cn(
                              "text-xs font-medium px-2.5 py-1 rounded-full",
                              evidenceStreamColors[es]
                            )}
                          >
                            {es}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Position in pipeline */}
                    <div>
                      <h4 className="text-sm font-semibold mb-1">
                        Pipeline Position
                      </h4>
                      <div className="flex items-center gap-1">
                        {modelLevels.map((l) => (
                          <div
                            key={l.id}
                            className={cn(
                              "h-2 flex-1 rounded-full",
                              l.id === selectedLevel.id
                                ? colorMap[l.id]
                                : "bg-muted"
                            )}
                            title={l.id}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Level{" "}
                        {modelLevels.findIndex(
                          (l) => l.id === selectedLevel.id
                        ) + 1}{" "}
                        of {modelLevels.length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ----------------------------------------------------------------- */}
        {/* Validation Matrix Tab                                              */}
        {/* ----------------------------------------------------------------- */}
        <TabsContent value="validation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Compound Validation Matrix</CardTitle>
              <CardDescription>
                Go / No-Go decisions across the A1–A10 hierarchy for active
                compounds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b sticky top-0 bg-background">
                      <th className="text-left py-3 px-2 font-semibold">
                        Compound
                      </th>
                      <th className="text-left py-3 px-2 font-semibold text-muted-foreground">
                        ID
                      </th>
                      {modelLevels.map((l) => (
                        <th
                          key={l.id}
                          className="text-center py-3 px-2 font-semibold"
                        >
                          {l.id}
                        </th>
                      ))}
                      <th className="text-center py-3 px-2 font-semibold">
                        Decision
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {compoundValidations.map((cv) => (
                      <tr
                        key={cv.id}
                        className="border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 px-2 font-medium">
                          {cv.compound}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {cv.id}
                        </td>
                        {modelLevels.map((l) => {
                          const status = cv.validations[l.id];
                          return (
                            <td key={l.id} className="py-3 px-2">
                              <div
                                className={cn(
                                  "h-4 w-4 rounded-full mx-auto",
                                  statusColors[status]
                                )}
                                title={`${l.id}: ${status}`}
                              />
                            </td>
                          );
                        })}
                        <td className="py-3 px-2 text-center">
                          <span
                            className={cn(
                              "text-xs font-medium px-2.5 py-1 rounded-full capitalize",
                              decisionBadge[cv.decision]
                            )}
                          >
                            {cv.decision}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t text-xs text-muted-foreground">
                <span className="font-medium">Legend:</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  Pass
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-yellow-500" />
                  Warning
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  Fail
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-gray-300" />
                  Pending
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------------------------------------------------------- */}
        {/* Evidence Streams Tab                                               */}
        {/* ----------------------------------------------------------------- */}
        <TabsContent value="evidence" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {evidenceStreams.map((stream) => (
              <Card
                key={stream.name}
                className={cn("border-l-4", stream.borderColor)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold",
                        stream.bgColor,
                        stream.color
                      )}
                    >
                      {stream.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className={cn("text-base", stream.color)}>
                        {stream.name}
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {stream.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Coverage badges */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">
                      Scale Coverage
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {stream.coverage.map((lvl) => (
                        <span
                          key={lvl}
                          className={cn(
                            "text-xs font-bold px-2 py-0.5 rounded-full text-white",
                            colorMap[lvl]
                          )}
                        >
                          {lvl}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Capabilities</h4>
                    <ul className="space-y-1">
                      {stream.capabilities.map((cap) => (
                        <li
                          key={cap}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              stream.color.replace("text-", "bg-")
                            )}
                          />
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
