"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type DrugOrigin = "de-novo" | "repositioned";
type DrugModality = "small-molecule" | "antibody" | "peptide" | "oligonucleotide" | "cell-therapy" | "gene-therapy";

interface Drug {
  id: string;
  name: string;
  origin: DrugOrigin;
  modality: DrugModality;
  target: string;
  indication: string;
  stage: "discovery" | "preclinical" | "phase-1" | "phase-2" | "phase-3" | "approved";
  moa: string;
  smiles?: string;
  mw?: string;
  originalIndication?: string;
}

const drugs: Drug[] = [
  { id: "SDD-0012", name: "Vemurafenib analog", origin: "de-novo", modality: "small-molecule", target: "BRAF V600E", indication: "Melanoma", stage: "preclinical", moa: "BRAF kinase inhibitor", mw: "510.4" },
  { id: "SDD-0034", name: "Tau-Phos-1", origin: "de-novo", modality: "small-molecule", target: "GSK-3\u03B2", indication: "Alzheimer\u2019s", stage: "discovery", moa: "GSK-3\u03B2 inhibitor", mw: "385.2" },
  { id: "SDD-0056", name: "JAK2-Sel-7", origin: "de-novo", modality: "small-molecule", target: "JAK2", indication: "Myelofibrosis", stage: "preclinical", moa: "Selective JAK2 inhibitor", mw: "442.8" },
  { id: "SDD-0078", name: "Osimertinib-R", origin: "repositioned", modality: "small-molecule", target: "EGFR T790M", indication: "NSCLC (C797S)", stage: "phase-1", moa: "Covalent EGFR inhibitor", mw: "499.6", originalIndication: "NSCLC (T790M)" },
  { id: "SDD-0091", name: "Anti-PD-L1-BRAF", origin: "de-novo", modality: "antibody", target: "PD-L1 + BRAF", indication: "Melanoma", stage: "discovery", moa: "Bispecific antibody" },
  { id: "SDD-0103", name: "Metformin", origin: "repositioned", modality: "small-molecule", target: "AMPK", indication: "Pancreatic cancer", stage: "phase-2", moa: "AMPK activator", mw: "129.2", originalIndication: "Type 2 Diabetes" },
  { id: "SDD-0115", name: "TAU-ASO-1", origin: "de-novo", modality: "oligonucleotide", target: "MAPT mRNA", indication: "Alzheimer\u2019s", stage: "discovery", moa: "Antisense oligonucleotide" },
  { id: "SDD-0127", name: "NK-BRAF-CAR", origin: "de-novo", modality: "cell-therapy", target: "BRAF V600E+ cells", indication: "Melanoma", stage: "discovery", moa: "CAR-NK cell therapy" },
  { id: "SDD-0139", name: "Thalidomide", origin: "repositioned", modality: "small-molecule", target: "Cereblon", indication: "Multiple Myeloma", stage: "approved", moa: "IMiD, cereblon modulator", mw: "258.2", originalIndication: "Morning sickness (withdrawn)" },
  { id: "SDD-0151", name: "RAS-pep-1", origin: "de-novo", modality: "peptide", target: "KRAS G12C", indication: "NSCLC", stage: "discovery", moa: "Stapled peptide inhibitor", mw: "1850" },
];

const modalityConfig: Record<DrugModality, { label: string; color: string }> = {
  "small-molecule": { label: "Small Molecule", color: "bg-blue-100 text-blue-800" },
  "antibody": { label: "Antibody", color: "bg-purple-100 text-purple-800" },
  "peptide": { label: "Peptide", color: "bg-green-100 text-green-800" },
  "oligonucleotide": { label: "Oligonucleotide", color: "bg-orange-100 text-orange-800" },
  "cell-therapy": { label: "Cell Therapy", color: "bg-red-100 text-red-800" },
  "gene-therapy": { label: "Gene Therapy", color: "bg-teal-100 text-teal-800" },
};

const stageConfig: Record<Drug["stage"], { label: string; color: string }> = {
  discovery: { label: "Discovery", color: "bg-gray-100 text-gray-800" },
  preclinical: { label: "Preclinical", color: "bg-blue-100 text-blue-800" },
  "phase-1": { label: "Phase 1", color: "bg-indigo-100 text-indigo-800" },
  "phase-2": { label: "Phase 2", color: "bg-purple-100 text-purple-800" },
  "phase-3": { label: "Phase 3", color: "bg-pink-100 text-pink-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
};

const stageFilters: { value: Drug["stage"] | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "discovery", label: "Discovery" },
  { value: "preclinical", label: "Preclinical" },
  { value: "phase-1", label: "Phase 1" },
  { value: "phase-2", label: "Phase 2" },
  { value: "phase-3", label: "Phase 3" },
  { value: "approved", label: "Approved" },
];

export default function DrugPage() {
  const [stageFilter, setStageFilter] = useState<Drug["stage"] | "all">("all");

  const filteredDrugs = stageFilter === "all" ? drugs : drugs.filter((d) => d.stage === stageFilter);

  const repositionedDrugs = drugs.filter((d) => d.origin === "repositioned");

  const drugsByModality = drugs.reduce<Record<DrugModality, Drug[]>>((acc, drug) => {
    if (!acc[drug.modality]) acc[drug.modality] = [];
    acc[drug.modality].push(drug);
    return acc;
  }, {} as Record<DrugModality, Drug[]>);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Drug</h1>
        <p className="text-muted-foreground">
          Drug candidates &mdash; repositioned, de novo, and classified by modality
        </p>
      </div>

      <Tabs defaultValue="all-drugs">
        <TabsList>
          <TabsTrigger value="all-drugs">All Drugs</TabsTrigger>
          <TabsTrigger value="by-class">By Class/Modality</TabsTrigger>
          <TabsTrigger value="repositioning">Repositioning</TabsTrigger>
        </TabsList>

        {/* Tab 1: All Drugs */}
        <TabsContent value="all-drugs" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {stageFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setStageFilter(f.value)}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  stageFilter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">ID</th>
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Origin</th>
                      <th className="px-4 py-3 text-left font-medium">Modality</th>
                      <th className="px-4 py-3 text-left font-medium">Target</th>
                      <th className="px-4 py-3 text-left font-medium">Indication</th>
                      <th className="px-4 py-3 text-left font-medium">Stage</th>
                      <th className="px-4 py-3 text-left font-medium">MoA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrugs.map((drug) => (
                      <tr key={drug.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">{drug.id}</td>
                        <td className="px-4 py-3 font-medium">{drug.name}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                              drug.origin === "de-novo"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            )}
                          >
                            {drug.origin === "de-novo" ? "De Novo" : "Repositioned"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                              modalityConfig[drug.modality].color
                            )}
                          >
                            {modalityConfig[drug.modality].label}
                          </span>
                        </td>
                        <td className="px-4 py-3">{drug.target}</td>
                        <td className="px-4 py-3">{drug.indication}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                              stageConfig[drug.stage].color
                            )}
                          >
                            {stageConfig[drug.stage].label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{drug.moa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: By Class/Modality */}
        <TabsContent value="by-class" className="space-y-6">
          {(Object.keys(modalityConfig) as DrugModality[])
            .filter((modality) => drugsByModality[modality]?.length > 0)
            .map((modality) => (
              <div key={modality} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-sm font-semibold",
                      modalityConfig[modality].color
                    )}
                  >
                    {modalityConfig[modality].label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {drugsByModality[modality].length} drug{drugsByModality[modality].length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {drugsByModality[modality].map((drug) => (
                    <Card key={drug.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{drug.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">{drug.id}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-medium">{drug.target}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Indication</span>
                          <span className="font-medium">{drug.indication}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Stage</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              stageConfig[drug.stage].color
                            )}
                          >
                            {stageConfig[drug.stage].label}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </TabsContent>

        {/* Tab 3: Repositioning */}
        <TabsContent value="repositioning" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Drugs originally developed for one indication, now being explored for new therapeutic areas.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {repositionedDrugs.map((drug) => (
              <Card key={drug.id} className="border-amber-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{drug.name}</CardTitle>
                  <CardDescription className="font-mono text-xs">{drug.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="rounded-lg bg-muted/60 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Original Indication</p>
                        <p className="font-medium">{drug.originalIndication}</p>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="shrink-0 text-amber-600"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                      <div className="flex-1 text-right">
                        <p className="text-xs text-muted-foreground">New Indication</p>
                        <p className="font-semibold text-amber-700">{drug.indication}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium">{drug.target}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stage</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          stageConfig[drug.stage].color
                        )}
                      >
                        {stageConfig[drug.stage].label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mechanism</span>
                      <span className="text-right font-medium">{drug.moa}</span>
                    </div>
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
