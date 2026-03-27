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

type ThreatLevel = "High" | "Medium" | "Low";
type OurPosition = "Discovery" | "Preclinical" | "Paused" | "Completed";

interface MarketCard {
  indication: string;
  market: string;
  cagr: string;
  topDrug: string;
  topDrugRevenue: string;
  ourPosition: OurPosition;
  ourProgram: string;
  competitors: string;
  opportunity: string;
}

interface CompetingProduct {
  company: string;
  product: string;
  indication: string;
  stage: string;
  mechanism: string;
  threatLevel: ThreatLevel;
}

const marketCards: MarketCard[] = [
  {
    indication: "Metastatic Melanoma",
    market: "$8.2B",
    cagr: "7.3%",
    topDrug: "Keytruda",
    topDrugRevenue: "$3.8B",
    ourPosition: "Preclinical",
    ourProgram: "BRAF program",
    competitors: "Pfizer (Phase 2), Roche (Phase 3)",
    opportunity: "Next-gen BRAF with reduced resistance",
  },
  {
    indication: "Alzheimer's Disease",
    market: "$12.1B",
    cagr: "15.2%",
    topDrug: "Leqembi",
    topDrugRevenue: "$1.2B",
    ourPosition: "Discovery",
    ourProgram: "Tau program",
    competitors: "Novartis (Phase 1), Lilly (Approved)",
    opportunity: "Tau-targeted vs amyloid approach",
  },
  {
    indication: "MPN",
    market: "$3.4B",
    cagr: "6.1%",
    topDrug: "Jakafi",
    topDrugRevenue: "$2.5B",
    ourPosition: "Paused",
    ourProgram: "JAK2",
    competitors: "BMS (Phase 1), Incyte (Approved)",
    opportunity: "Selective JAK2 with fewer side effects",
  },
  {
    indication: "NSCLC (EGFR)",
    market: "$15.6B",
    cagr: "8.9%",
    topDrug: "Tagrisso",
    topDrugRevenue: "$5.8B",
    ourPosition: "Completed",
    ourProgram: "EGFR program",
    competitors: "AZ (Phase 2), Merck (Discontinued)",
    opportunity: "4th-gen overcoming C797S",
  },
];

const competingProducts: CompetingProduct[] = [
  { company: "Insilico Medicine", product: "INS018_055", indication: "IPF", stage: "Phase 2", mechanism: "TNIK inhibitor", threatLevel: "Low" },
  { company: "Recursion", product: "REC-994", indication: "CCM", stage: "Phase 2", mechanism: "Undisclosed", threatLevel: "Low" },
  { company: "Exscientia", product: "EXS21546", indication: "Solid tumors", stage: "Phase 1", mechanism: "A2a antagonist", threatLevel: "Medium" },
  { company: "BenevolentAI", product: "BEN-8744", indication: "Ulcerative colitis", stage: "Phase 2", mechanism: "PDE10 inhibitor", threatLevel: "Low" },
  { company: "Relay Therapeutics", product: "RLY-2608", indication: "Breast cancer", stage: "Phase 1", mechanism: "PI3K\u03B1", threatLevel: "Medium" },
  { company: "AbCellera", product: "Various", indication: "Multiple", stage: "Discovery-Phase 1", mechanism: "Antibody platform", threatLevel: "Medium" },
];

const positionColors: Record<OurPosition, string> = {
  Discovery: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Preclinical: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  Paused: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

const threatColors: Record<ThreatLevel, string> = {
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function BusinessOptimizationPage() {
  const [_view] = useState("landscape");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Optimization</h1>
        <p className="text-muted-foreground">
          PharmNexus competitive intelligence, market analysis, and strategic positioning
        </p>
      </div>

      {/* Market Landscape */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Market Landscape</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketCards.map((m) => (
            <Card key={m.indication}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{m.indication}</CardTitle>
                  <span
                    className={cn(
                      "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                      positionColors[m.ourPosition]
                    )}
                  >
                    {m.ourPosition}
                  </span>
                </div>
                <CardDescription>{m.ourProgram}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-3xl font-bold">{m.market}</p>
                  <p className="text-sm text-muted-foreground">
                    Market size &middot; CAGR {m.cagr}
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Top Drug</span>
                    <span className="font-medium">{m.topDrug} ({m.topDrugRevenue})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Competitors</span>
                    <span className="text-right">{m.competitors}</span>
                  </div>
                </div>
                <div className="rounded-md bg-muted/50 p-2 text-sm">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Opportunity</p>
                  <p>{m.opportunity}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Competing Products Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Competing Products Tracker</CardTitle>
          <CardDescription>AI-driven drug discovery companies and their pipeline assets</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Company</th>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">Indication</th>
                  <th className="px-4 py-3 text-left font-medium">Stage</th>
                  <th className="px-4 py-3 text-left font-medium">Mechanism</th>
                  <th className="px-4 py-3 text-left font-medium">Threat Level</th>
                </tr>
              </thead>
              <tbody>
                {competingProducts.map((c, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{c.company}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.product}</td>
                    <td className="px-4 py-3">{c.indication}</td>
                    <td className="px-4 py-3">{c.stage}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.mechanism}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                          threatColors[c.threatLevel]
                        )}
                      >
                        {c.threatLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
