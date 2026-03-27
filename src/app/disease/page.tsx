"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface DiseaseGroup {
  id: string;
  name: string;
  description: string;
  subtypeCount: number;
  targetCount: number;
  activePrograms: number;
  icdCode: string;
}

interface DiseaseSubtype {
  id: string;
  name: string;
  group: string;
  prevalence: string;
  biomarkers: string[];
  standardOfCare: string;
  unmetNeed: "high" | "medium" | "low";
}

interface Cohort {
  id: string;
  name: string;
  disease: string;
  size: number;
  source: string;
  dataTypes: string[];
  status: "recruiting" | "active" | "completed";
}

const diseaseGroups: DiseaseGroup[] = [
  {
    id: "DG-001",
    name: "Melanoma",
    description: "Malignant tumors arising from melanocytes",
    subtypeCount: 4,
    targetCount: 6,
    activePrograms: 2,
    icdCode: "C43",
  },
  {
    id: "DG-002",
    name: "Alzheimer's Disease",
    description: "Progressive neurodegenerative disorder",
    subtypeCount: 3,
    targetCount: 8,
    activePrograms: 1,
    icdCode: "G30",
  },
  {
    id: "DG-003",
    name: "Myeloproliferative Neoplasms",
    description: "Clonal hematopoietic stem cell disorders",
    subtypeCount: 3,
    targetCount: 4,
    activePrograms: 1,
    icdCode: "D47",
  },
  {
    id: "DG-004",
    name: "Non-Small Cell Lung Cancer",
    description: "Most common type of lung cancer",
    subtypeCount: 5,
    targetCount: 10,
    activePrograms: 1,
    icdCode: "C34",
  },
  {
    id: "DG-005",
    name: "Rheumatoid Arthritis",
    description: "Chronic inflammatory autoimmune disease",
    subtypeCount: 2,
    targetCount: 5,
    activePrograms: 0,
    icdCode: "M06",
  },
];

const diseaseSubtypes: DiseaseSubtype[] = [
  {
    id: "DS-001",
    name: "BRAF V600E Melanoma",
    group: "Melanoma",
    prevalence: "~50% of melanomas",
    biomarkers: ["BRAF V600E", "MEK", "PD-L1"],
    standardOfCare: "BRAF/MEK inhibitors",
    unmetNeed: "high",
  },
  {
    id: "DS-002",
    name: "NRAS Mutant Melanoma",
    group: "Melanoma",
    prevalence: "~20% of melanomas",
    biomarkers: ["NRAS Q61", "MEK"],
    standardOfCare: "Checkpoint immunotherapy",
    unmetNeed: "high",
  },
  {
    id: "DS-003",
    name: "Early-onset Alzheimer's",
    group: "Alzheimer's Disease",
    prevalence: "5-10% of cases",
    biomarkers: ["APP", "PSEN1", "PSEN2"],
    standardOfCare: "Cholinesterase inhibitors",
    unmetNeed: "high",
  },
  {
    id: "DS-004",
    name: "Late-onset Alzheimer's",
    group: "Alzheimer's Disease",
    prevalence: "90-95% of cases",
    biomarkers: ["APOE4", "Tau", "Amyloid-\u03B2"],
    standardOfCare: "Lecanemab, Donanemab",
    unmetNeed: "medium",
  },
  {
    id: "DS-005",
    name: "Polycythemia Vera",
    group: "MPN",
    prevalence: "0.01-0.02%",
    biomarkers: ["JAK2 V617F"],
    standardOfCare: "Ruxolitinib",
    unmetNeed: "medium",
  },
  {
    id: "DS-006",
    name: "EGFR-mutant NSCLC",
    group: "NSCLC",
    prevalence: "15-30% of NSCLC",
    biomarkers: ["EGFR L858R", "EGFR T790M", "EGFR C797S"],
    standardOfCare: "Osimertinib",
    unmetNeed: "medium",
  },
  {
    id: "DS-007",
    name: "ALK-positive NSCLC",
    group: "NSCLC",
    prevalence: "3-7% of NSCLC",
    biomarkers: ["ALK fusion", "EML4-ALK"],
    standardOfCare: "Alectinib, Lorlatinib",
    unmetNeed: "low",
  },
  {
    id: "DS-008",
    name: "Seropositive RA",
    group: "RA",
    prevalence: "~70% of RA",
    biomarkers: ["RF+", "Anti-CCP+", "TNF-\u03B1"],
    standardOfCare: "Methotrexate, biologics",
    unmetNeed: "low",
  },
];

const cohorts: Cohort[] = [
  {
    id: "COH-001",
    name: "BRAF-MEL-2024",
    disease: "Melanoma",
    size: 450,
    source: "UAB Cancer Center",
    dataTypes: ["Genomics", "Imaging", "Clinical outcomes"],
    status: "active",
  },
  {
    id: "COH-002",
    name: "TAU-AD-2023",
    disease: "Alzheimer's",
    size: 1200,
    source: "ADNI Consortium",
    dataTypes: ["PET imaging", "CSF biomarkers", "Cognitive scores", "Genomics"],
    status: "active",
  },
  {
    id: "COH-003",
    name: "MPN-JAK2-2024",
    disease: "MPN",
    size: 320,
    source: "MD Anderson",
    dataTypes: ["Genomics", "Blood panels", "Bone marrow biopsy"],
    status: "recruiting",
  },
  {
    id: "COH-004",
    name: "NSCLC-RESIST-2025",
    disease: "NSCLC",
    size: 800,
    source: "Multi-site (12 centers)",
    dataTypes: ["Genomics", "ctDNA", "Radiology", "Treatment response"],
    status: "recruiting",
  },
  {
    id: "COH-005",
    name: "RA-BIO-2023",
    disease: "RA",
    size: 650,
    source: "Johns Hopkins",
    dataTypes: ["Autoantibodies", "Joint imaging", "Cytokine panels"],
    status: "completed",
  },
];

const subtypeGroups = ["All", ...Array.from(new Set(diseaseSubtypes.map((s) => s.group)))];

const unmetNeedColors: Record<string, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
};

const statusColors: Record<string, string> = {
  recruiting: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  completed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export default function DiseasePage() {
  const [selectedGroup, setSelectedGroup] = useState("All");

  const filteredSubtypes =
    selectedGroup === "All"
      ? diseaseSubtypes
      : diseaseSubtypes.filter((s) => s.group === selectedGroup);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Disease</h1>
        <p className="text-muted-foreground mt-1">
          Disease groups, subtypes, and patient cohorts
        </p>
      </div>

      <Tabs defaultValue="groups">
        <TabsList>
          <TabsTrigger value="groups">Disease Groups</TabsTrigger>
          <TabsTrigger value="subtypes">Subtypes</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
        </TabsList>

        {/* Disease Groups Tab */}
        <TabsContent value="groups">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {diseaseGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <div className="text-2xl font-bold">{group.subtypeCount}</div>
                      <div className="text-xs text-muted-foreground">Subtypes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{group.targetCount}</div>
                      <div className="text-xs text-muted-foreground">Targets</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{group.activePrograms}</div>
                      <div className="text-xs text-muted-foreground">Active Programs</div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      ICD: {group.icdCode}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Subtypes Tab */}
        <TabsContent value="subtypes">
          <div className="flex flex-wrap gap-2 mt-4 mb-4">
            {subtypeGroups.map((group) => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors",
                  selectedGroup === group
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {group}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSubtypes.map((subtype) => (
              <Card key={subtype.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{subtype.name}</CardTitle>
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {subtype.group}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Prevalence: </span>
                    <span className="font-medium">{subtype.prevalence}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {subtype.biomarkers.map((biomarker) => (
                      <span
                        key={biomarker}
                        className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium"
                      >
                        {biomarker}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Standard of care: </span>
                    <span className="font-medium">{subtype.standardOfCare}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Unmet need:</span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        unmetNeedColors[subtype.unmetNeed]
                      )}
                    >
                      {subtype.unmetNeed}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Cohorts Tab */}
        <TabsContent value="cohorts">
          <div className="mt-4 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Disease</th>
                  <th className="text-left px-4 py-3 font-medium">Size</th>
                  <th className="text-left px-4 py-3 font-medium">Source</th>
                  <th className="text-left px-4 py-3 font-medium">Data Types</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort) => (
                  <tr key={cohort.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{cohort.name}</td>
                    <td className="px-4 py-3">{cohort.disease}</td>
                    <td className="px-4 py-3">{cohort.size.toLocaleString()}</td>
                    <td className="px-4 py-3">{cohort.source}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {cohort.dataTypes.map((dt) => (
                          <span
                            key={dt}
                            className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium"
                          >
                            {dt}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                          statusColors[cohort.status]
                        )}
                      >
                        {cohort.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
