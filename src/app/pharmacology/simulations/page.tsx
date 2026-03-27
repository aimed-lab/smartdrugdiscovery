"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SimStatus = "Pass" | "Warn" | "Fail" | "Pending" | "none";

interface SimulationRow {
  compound: string;
  levels: SimStatus[];
}

const scaleLabels = [
  { key: "A1", label: "Gene" },
  { key: "A2", label: "Pathway" },
  { key: "A3", label: "Network" },
  { key: "A4", label: "Cell" },
  { key: "A5", label: "Tissue" },
  { key: "A6", label: "Organ" },
  { key: "A7", label: "Patient" },
  { key: "A8", label: "Cohort" },
  { key: "A9", label: "Population" },
  { key: "A10", label: "Global" },
];

const simulationData: SimulationRow[] = [
  {
    compound: "SDD-0012",
    levels: ["Pass", "Pass", "Pass", "Pass", "Pass", "Pending", "none", "none", "none", "none"],
  },
  {
    compound: "SDD-0056",
    levels: ["Pass", "Pass", "Pass", "Warn", "none", "none", "none", "none", "none", "none"],
  },
  {
    compound: "SDD-0078",
    levels: ["Pass", "Pass", "Pass", "Pass", "Pass", "Pass", "Pass", "Pending", "none", "none"],
  },
  {
    compound: "SDD-0089",
    levels: ["Pass", "Pass", "Warn", "none", "none", "none", "none", "none", "none", "none"],
  },
];

const statusConfig: Record<SimStatus, { bg: string; ring: string; label: string }> = {
  Pass: {
    bg: "bg-green-500",
    ring: "ring-green-200 dark:ring-green-800",
    label: "Pass",
  },
  Warn: {
    bg: "bg-yellow-500",
    ring: "ring-yellow-200 dark:ring-yellow-800",
    label: "Warn",
  },
  Fail: {
    bg: "bg-red-500",
    ring: "ring-red-200 dark:ring-red-800",
    label: "Fail",
  },
  Pending: {
    bg: "bg-blue-500",
    ring: "ring-blue-200 dark:ring-blue-800",
    label: "Pending",
  },
  none: {
    bg: "bg-gray-200 dark:bg-gray-700",
    ring: "ring-gray-100 dark:ring-gray-800",
    label: "\u2014",
  },
};

export default function SimulationsPage() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const filteredData =
    activeStep === null
      ? simulationData
      : simulationData.filter((row) => row.levels[activeStep] !== "none");

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Model Simulations</h1>
        <p className="text-muted-foreground mt-1">
          Multi-scale validation across the A1&#8211;A10 hierarchy
        </p>
      </div>

      {/* A1-A10 Pipeline Stepper */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {scaleLabels.map((step, i) => (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => setActiveStep(activeStep === i ? null : i)}
                  className={cn(
                    "flex flex-col items-center gap-1 group cursor-pointer",
                    activeStep === i && "scale-110"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      activeStep === i
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                    )}
                  >
                    {step.key}
                  </div>
                  <span
                    className={cn(
                      "text-xs whitespace-nowrap",
                      activeStep === i ? "font-semibold text-primary" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                {i < scaleLabels.length - 1 && (
                  <div className="w-6 md:w-10 lg:w-14 h-0.5 bg-muted mx-1 mt-[-12px]" />
                )}
              </div>
            ))}
          </div>
          {activeStep !== null && (
            <div className="mt-3 text-sm text-muted-foreground text-center">
              Filtering by: <span className="font-medium text-foreground">{scaleLabels[activeStep].key} {scaleLabels[activeStep].label}</span>
              <button
                onClick={() => setActiveStep(null)}
                className="ml-2 text-primary hover:underline"
              >
                Clear
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {(["Pass", "Warn", "Fail", "Pending", "none"] as SimStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-2">
            <div
              className={cn(
                "w-3.5 h-3.5 rounded-full",
                statusConfig[status].bg
              )}
            />
            <span className="text-muted-foreground">{statusConfig[status].label}</span>
          </div>
        ))}
      </div>

      {/* Simulation Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Simulation Results</CardTitle>
          <CardDescription>Go/no-go matrix across multi-scale hierarchy</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Compound</th>
                  {scaleLabels.map((step) => (
                    <th key={step.key} className="text-center px-3 py-3 font-medium">
                      {step.key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr key={row.compound} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{row.compound}</td>
                    {row.levels.map((status, i) => (
                      <td key={i} className="text-center px-3 py-3">
                        <div className="flex justify-center">
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full ring-2",
                              statusConfig[status].bg,
                              statusConfig[status].ring
                            )}
                            title={`${scaleLabels[i].key}: ${statusConfig[status].label}`}
                          />
                        </div>
                      </td>
                    ))}
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
