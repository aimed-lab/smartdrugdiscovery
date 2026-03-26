"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Target {
  id: string;
  name: string;
  gene: string;
  organism: string;
  diseaseArea: string;
  compoundCount: number;
  targetClass: string;
}

const targets: Target[] = [
  {
    id: "TGT-001",
    name: "Epidermal Growth Factor Receptor",
    gene: "EGFR",
    organism: "Homo sapiens",
    diseaseArea: "Non-Small Cell Lung Cancer",
    compoundCount: 42,
    targetClass: "Kinase",
  },
  {
    id: "TGT-002",
    name: "B-Raf Proto-Oncogene",
    gene: "BRAF",
    organism: "Homo sapiens",
    diseaseArea: "Melanoma",
    compoundCount: 35,
    targetClass: "Kinase",
  },
  {
    id: "TGT-003",
    name: "Anaplastic Lymphoma Kinase",
    gene: "ALK",
    organism: "Homo sapiens",
    diseaseArea: "Non-Small Cell Lung Cancer",
    compoundCount: 18,
    targetClass: "Kinase",
  },
  {
    id: "TGT-004",
    name: "Cyclooxygenase-2",
    gene: "PTGS2",
    organism: "Homo sapiens",
    diseaseArea: "Inflammation / Pain",
    compoundCount: 28,
    targetClass: "Enzyme",
  },
  {
    id: "TGT-005",
    name: "Beta-Secretase 1",
    gene: "BACE1",
    organism: "Homo sapiens",
    diseaseArea: "Alzheimer's Disease",
    compoundCount: 15,
    targetClass: "Protease",
  },
  {
    id: "TGT-006",
    name: "Janus Kinase 2",
    gene: "JAK2",
    organism: "Homo sapiens",
    diseaseArea: "Myeloproliferative Disorders",
    compoundCount: 22,
    targetClass: "Kinase",
  },
];

const classColors: Record<string, string> = {
  Kinase: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  Enzyme: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Protease: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export default function TargetsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Targets</h1>
        <p className="text-muted-foreground mt-1">
          Biological targets under investigation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {targets.map((target) => (
          <Card key={target.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{target.gene}</CardTitle>
                  <CardDescription className="mt-1">{target.name}</CardDescription>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    classColors[target.targetClass] ?? "bg-gray-100 text-gray-800"
                  )}
                >
                  {target.targetClass}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Organism</dt>
                  <dd className="font-medium italic">{target.organism}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Disease Area</dt>
                  <dd className="font-medium text-right">{target.diseaseArea}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Compounds</dt>
                  <dd className="font-medium">
                    <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
                      {target.compoundCount}
                    </span>
                  </dd>
                </div>
              </dl>
              <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                {target.id}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
