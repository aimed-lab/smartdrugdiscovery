"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Compliance = "Compliant" | "Partial" | "Internal only" | "Restricted";

interface LicenseAsset {
  asset: string;
  type: string;
  license: string;
  fairScore: [boolean, boolean, boolean, boolean]; // F, A, I, R
  compliance: Compliance;
  owner: string;
  expiry: string;
}

const licenseAssets: LicenseAsset[] = [
  {
    asset: "ChEMBL Bioactivity Data",
    type: "Dataset",
    license: "CC BY-SA 4.0",
    fairScore: [true, true, true, true],
    compliance: "Compliant",
    owner: "EMBL-EBI",
    expiry: "Perpetual",
  },
  {
    asset: "AlphaFold Structures",
    type: "Model",
    license: "Apache 2.0",
    fairScore: [true, true, true, true],
    compliance: "Compliant",
    owner: "DeepMind",
    expiry: "Perpetual",
  },
  {
    asset: "UAB scRNA-seq Atlas",
    type: "Dataset",
    license: "OSDD2",
    fairScore: [true, true, false, true],
    compliance: "Partial",
    owner: "UAB SPARC",
    expiry: "2028-12-31",
  },
  {
    asset: "BRAF Compound Library",
    type: "Compound data",
    license: "Proprietary",
    fairScore: [true, true, false, false],
    compliance: "Internal only",
    owner: "PharmaTech",
    expiry: "2027-06-30",
  },
  {
    asset: "GeneTerrain GTKM",
    type: "Software",
    license: "GPL-3.0",
    fairScore: [true, true, true, true],
    compliance: "Compliant",
    owner: "UAB SPARC",
    expiry: "Perpetual",
  },
  {
    asset: "CPA Perturbation Model",
    type: "Model",
    license: "MIT",
    fairScore: [true, true, true, true],
    compliance: "Compliant",
    owner: "Lotfollahi et al.",
    expiry: "Perpetual",
  },
  {
    asset: "Clinical Trial Data (BRAF-301)",
    type: "Clinical",
    license: "IRB Restricted",
    fairScore: [true, false, false, false],
    compliance: "Restricted",
    owner: "UAB IRB",
    expiry: "2030-12-31",
  },
  {
    asset: "PharmAlchemy KB",
    type: "Knowledge base",
    license: "OSDD2",
    fairScore: [true, true, true, true],
    compliance: "Compliant",
    owner: "UAB SPARC",
    expiry: "Perpetual",
  },
];

const complianceStyles: Record<Compliance, string> = {
  Compliant: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Internal only": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  Restricted: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const fairLabels = ["F", "A", "I", "R"] as const;

function FairDots({ score }: { score: [boolean, boolean, boolean, boolean] }) {
  return (
    <div className="flex items-center gap-1">
      {score.map((pass, i) => (
        <span
          key={i}
          title={`${fairLabels[i]}: ${pass ? "Pass" : "Fail"}`}
          className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
            pass
              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
              : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
          )}
        >
          {fairLabels[i]}
        </span>
      ))}
    </div>
  );
}

export default function LicensingPage() {
  const [_filter] = useState("All");

  const totalCompliant = licenseAssets.filter((a) => a.compliance === "Compliant").length;
  const totalAssets = licenseAssets.length;
  const avgFair = (
    licenseAssets.reduce((sum, a) => sum + a.fairScore.filter(Boolean).length, 0) / totalAssets
  ).toFixed(1);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Copyright / OSDD2 License</h1>
        <p className="text-muted-foreground">
          Open science compliance, FAIR data governance, and licensing management
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{totalAssets}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Assets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{totalCompliant}</div>
            <div className="text-sm text-muted-foreground mt-1">Fully Compliant</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{avgFair}/4</div>
            <div className="text-sm text-muted-foreground mt-1">Avg FAIR Score</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">3</div>
            <div className="text-sm text-muted-foreground mt-1">OSDD2 Licensed</div>
          </CardContent>
        </Card>
      </div>

      {/* License Registry Table */}
      <Card>
        <CardHeader>
          <CardTitle>License Registry</CardTitle>
          <CardDescription>All data assets, models, and software with licensing and FAIR compliance status</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Asset</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">License</th>
                  <th className="px-4 py-3 text-left font-medium">FAIR Score</th>
                  <th className="px-4 py-3 text-left font-medium">Compliance</th>
                  <th className="px-4 py-3 text-left font-medium">Owner</th>
                  <th className="px-4 py-3 text-left font-medium">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {licenseAssets.map((a, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{a.asset}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.type}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-mono">
                        {a.license}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <FairDots score={a.fairScore} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          complianceStyles[a.compliance]
                        )}
                      >
                        {a.compliance}
                      </span>
                    </td>
                    <td className="px-4 py-3">{a.owner}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.expiry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* OSDD2 Framework */}
      <Card>
        <CardHeader>
          <CardTitle>OSDD2 Framework</CardTitle>
          <CardDescription>Open Source Drug Discovery 2.0 principles and governance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed">
            OSDD2 extends open-source principles to drug discovery, enabling collaborative research
            while protecting patient data and commercially sensitive information. Assets under OSDD2
            license are freely available for academic research, with commercial use requiring
            attribution and contribution-back agreements.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Open Access Tier</p>
              <p className="text-sm font-medium">Academic &amp; Non-Profit</p>
              <p className="text-xs text-muted-foreground mt-1">
                Full access to datasets, models, and tools for non-commercial research with attribution.
              </p>
            </div>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Collaborative Tier</p>
              <p className="text-sm font-medium">Contribution-Back</p>
              <p className="text-xs text-muted-foreground mt-1">
                Commercial entities may use OSDD2 assets with mandatory contribution of improvements back to the commons.
              </p>
            </div>
            <div className="rounded-md bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Protected Tier</p>
              <p className="text-sm font-medium">Patient &amp; IP Data</p>
              <p className="text-xs text-muted-foreground mt-1">
                Clinical and proprietary data under IRB or NDA restrictions with controlled access protocols.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
