"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Compound {
  id: string;
  name: string;
  smiles: string;
  mw: number;
  logP: number;
  qed: number;
  status: "screening" | "hit" | "lead" | "preclinical";
  target: string;
}

const compounds: Compound[] = [
  { id: "SDD-0012", name: "Vemurafenib", smiles: "CCCS(=O)(=O)Nc1ccc(F)c(C(=O)c2cc[nH]c2C)c1F", mw: 489.92, logP: 3.6, qed: 0.72, status: "preclinical", target: "BRAF V600E" },
  { id: "SDD-0034", name: "Erlotinib", smiles: "COCCOc1cc2ncnc(Nc3cccc(C#C)c3)c2cc1OCCOC", mw: 393.44, logP: 2.7, qed: 0.81, status: "lead", target: "EGFR" },
  { id: "SDD-0056", name: "Imatinib", smiles: "Cc1ccc(NC(=O)c2ccc(CN3CCN(C)CC3)cc2)cc1Nc1nccc(-c2cccnc2)n1", mw: 493.60, logP: 2.5, qed: 0.77, status: "preclinical", target: "BCR-ABL" },
  { id: "SDD-0078", name: "Sorafenib", smiles: "CNC(=O)c1cc(Oc2ccc(NC(=O)Nc3ccc(Cl)c(C(F)(F)F)c3)cc2)ccn1", mw: 464.83, logP: 3.8, qed: 0.68, status: "lead", target: "BRAF/VEGFR" },
  { id: "SDD-0091", name: "Gefitinib", smiles: "COc1cc2ncnc(Nc3ccc(F)c(Cl)c3)c2cc1OCCCN1CCOCC1", mw: 446.90, logP: 3.2, qed: 0.75, status: "hit", target: "EGFR" },
  { id: "SDD-0103", name: "Lapatinib", smiles: "CS(=O)(=O)CCNCc1ccc(-c2ccc3ncnc(Nc4ccc(OCc5cccc(F)c5)c(Cl)c4)c3c2)o1", mw: 581.06, logP: 4.6, qed: 0.54, status: "screening", target: "HER2/EGFR" },
  { id: "SDD-0127", name: "Crizotinib", smiles: "CC(Oc1cc(-c2cnn(C3CCNCC3)c2)cnc1N)c1c(Cl)ccc(F)c1Cl", mw: 450.34, logP: 3.7, qed: 0.70, status: "hit", target: "ALK" },
  { id: "SDD-0145", name: "Dabrafenib", smiles: "CC(C)(C)c1nc(-c2cccc(NS(=O)(=O)c3c(F)cccc3F)c2F)c(-c2ccnc(N)n2)s1", mw: 519.56, logP: 3.1, qed: 0.66, status: "lead", target: "BRAF V600E" },
  { id: "SDD-0168", name: "Osimertinib", smiles: "COc1cc(N(C)CCN(C)C)c(NC(=O)C=C)cc1Nc1nccc(-c2cn(C)c3ccccc23)n1", mw: 499.62, logP: 3.4, qed: 0.73, status: "preclinical", target: "EGFR T790M" },
  { id: "SDD-0190", name: "Trametinib", smiles: "CC(=O)Nc1cccc(-n2c(=O)c3c(Nc4ccc(I)cc4F)n(C)c(=O)n3c2=O)c1", mw: 615.40, logP: 2.9, qed: 0.61, status: "screening", target: "MEK1/2" },
];

const statusConfig: Record<Compound["status"], { label: string; className: string }> = {
  screening: { label: "Screening", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  hit: { label: "Hit", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  lead: { label: "Lead", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  preclinical: { label: "Preclinical", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
};

type SortKey = keyof Compound;
type SortDir = "asc" | "desc";

export default function CompoundsPage() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = compounds.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.target.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.smiles.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      return matchSearch && matchStatus;
    });

    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp = typeof aVal === "number" ? aVal - (bVal as number) : String(aVal).localeCompare(String(bVal));
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [search, sortKey, sortDir, statusFilter]);

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === field && (
          <span className="text-foreground">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Compounds</h1>
        <p className="text-muted-foreground mt-1">
          Browse and filter your compound library
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search compounds by name, ID, target, or SMILES..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="screening">Screening</option>
              <option value="hit">Hit</option>
              <option value="lead">Lead</option>
              <option value="preclinical">Preclinical</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <SortHeader label="ID" field="id" />
                  <SortHeader label="Name" field="name" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">SMILES</th>
                  <SortHeader label="MW" field="mw" />
                  <SortHeader label="LogP" field="logP" />
                  <SortHeader label="QED" field="qed" />
                  <SortHeader label="Status" field="status" />
                  <SortHeader label="Target" field="target" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((compound) => (
                  <tr key={compound.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{compound.id}</td>
                    <td className="px-4 py-3 text-sm font-medium">{compound.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground max-w-[200px] truncate" title={compound.smiles}>
                      {compound.smiles}
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums">{compound.mw.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm tabular-nums">{compound.logP.toFixed(1)}</td>
                    <td className="px-4 py-3 text-sm tabular-nums">{compound.qed.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusConfig[compound.status].className)}>
                        {statusConfig[compound.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{compound.target}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No compounds found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Showing {filtered.length} of {compounds.length} compounds
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
