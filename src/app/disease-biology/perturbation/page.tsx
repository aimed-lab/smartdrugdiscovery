"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Simulation {
  id: string;
  target: string;
  perturbation: string;
  model: string;
  cellType: string;
  status: "Completed" | "Running" | "Queued";
  result: string;
}

const simulations: Simulation[] = [
  { id: "SIM-001", target: "BRAF V600E", perturbation: "Gene KO", model: "CPA", cellType: "A375 Melanoma", status: "Completed", result: "85% viability reduction" },
  { id: "SIM-002", target: "GSK-3\u03B2", perturbation: "Small molecule inhibitor", model: "State", cellType: "iPSC-derived neurons", status: "Running", result: "Estimated 20 min" },
  { id: "SIM-003", target: "JAK2 V617F", perturbation: "CRISPR edit", model: "CPA", cellType: "HEL cells", status: "Completed", result: "Normalized STAT signaling" },
  { id: "SIM-004", target: "EGFR T790M", perturbation: "Drug combination", model: "PETS", cellType: "H1975 NSCLC", status: "Completed", result: "Synergy score: 0.82" },
  { id: "SIM-005", target: "miR-21", perturbation: "AntimiR", model: "CPA", cellType: "A549 cells", status: "Queued", result: "\u2014" },
  { id: "SIM-006", target: "CD8+ T cells", perturbation: "Checkpoint blockade", model: "State", cellType: "TIL population", status: "Running", result: "Estimated 45 min" },
];

const engines = ["PETS Engine", "CPA Model", "State (Virtual Cell)", "GeneTerrain"] as const;

const perturbationTypes = ["Gene KO", "Small molecule", "CRISPR", "Drug combo", "AntimiR"] as const;
const modelOptions = ["CPA", "State", "PETS", "GeneTerrain"] as const;

const statusConfig: Record<string, { badge: string; pulse?: boolean }> = {
  Completed: { badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  Running: { badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", pulse: true },
  Queued: { badge: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300" },
};

export default function PerturbationPage() {
  const [selectedEngine, setSelectedEngine] = useState<string>("PETS Engine");
  const [newTarget, setNewTarget] = useState("");
  const [newPerturbation, setNewPerturbation] = useState<string>(perturbationTypes[0]);
  const [newModel, setNewModel] = useState<string>(modelOptions[0]);
  const [newCellType, setNewCellType] = useState("");

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Perturbation Simulations</h1>
        <p className="text-muted-foreground mt-1">
          In silico perturbation modeling using virtual cell and network models
        </p>
      </div>

      {/* Simulation Engine Selector */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Simulation Engine</h2>
        <div className="flex flex-wrap gap-2">
          {engines.map((engine) => (
            <button
              key={engine}
              onClick={() => setSelectedEngine(engine)}
              className={cn(
                "inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors border",
                selectedEngine === engine
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              )}
            >
              {engine}
            </button>
          ))}
        </div>
      </div>

      {/* Simulation Queue */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Simulation Queue</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Target</th>
                <th className="text-left px-4 py-3 font-medium">Perturbation</th>
                <th className="text-left px-4 py-3 font-medium">Model</th>
                <th className="text-left px-4 py-3 font-medium">Cell Type</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {simulations.map((sim) => (
                <tr key={sim.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{sim.id}</td>
                  <td className="px-4 py-3 font-medium">{sim.target}</td>
                  <td className="px-4 py-3">{sim.perturbation}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {sim.model}
                    </span>
                  </td>
                  <td className="px-4 py-3">{sim.cellType}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusConfig[sim.status].badge,
                      statusConfig[sim.status].pulse && "animate-pulse"
                    )}>
                      {sim.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{sim.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Simulation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New Simulation</CardTitle>
          <CardDescription>Configure and launch a new perturbation simulation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target</label>
              <select
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select target...</option>
                <option value="BRAF V600E">BRAF V600E</option>
                <option value="MAPT (Tau)">MAPT (Tau)</option>
                <option value="JAK2 V617F">JAK2 V617F</option>
                <option value="EGFR T790M">EGFR T790M</option>
                <option value="miR-21">miR-21</option>
                <option value="GSK-3\u03B2">GSK-3\u03B2</option>
                <option value="CD8+ T cells">CD8+ T cells</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Perturbation Type</label>
              <select
                value={newPerturbation}
                onChange={(e) => setNewPerturbation(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {perturbationTypes.map((pt) => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <select
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                {modelOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cell Type</label>
              <input
                type="text"
                value={newCellType}
                onChange={(e) => setNewCellType(e.target.value)}
                placeholder="e.g., A375 Melanoma"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-6">
            <button className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              Run Simulation
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
