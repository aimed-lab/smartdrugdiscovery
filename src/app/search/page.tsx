"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SearchResult {
  chemblId: string;
  name: string;
  smiles: string;
  mw: number;
  logP: number;
  maxPhase: number;
  moleculeType: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      if (!res.ok) throw new Error("Search request failed");
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setError("Failed to fetch search results. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const phaseLabel = (phase: number) => {
    if (phase === 4) return "Approved";
    if (phase >= 1) return `Phase ${phase}`;
    return "Preclinical";
  };

  const phaseClass = (phase: number) => {
    if (phase === 4) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (phase >= 1) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Search ChEMBL</h1>
        <p className="text-muted-foreground mt-1">
          Search for compounds in the ChEMBL database
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compound Search</CardTitle>
          <CardDescription>Enter a compound name, target, or ChEMBL ID</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. aspirin, imatinib, CHEMBL25..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {searched && !loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Results</CardTitle>
            <CardDescription>
              {results.length > 0
                ? `Found ${results.length} compound${results.length === 1 ? "" : "s"} matching "${query}"`
                : `No results found for "${query}"`}
            </CardDescription>
          </CardHeader>
          {results.length > 0 && (
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ChEMBL ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">SMILES</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">MW</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">LogP</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Phase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.map((r) => (
                      <tr key={r.chemblId} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-primary">{r.chemblId}</td>
                        <td className="px-4 py-3 text-sm font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{r.moleculeType}</td>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground max-w-[180px] truncate" title={r.smiles}>
                          {r.smiles}
                        </td>
                        <td className="px-4 py-3 text-sm tabular-nums">{r.mw.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm tabular-nums">{r.logP.toFixed(1)}</td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", phaseClass(r.maxPhase))}>
                            {phaseLabel(r.maxPhase)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {!searched && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Enter a search query to get started</p>
              <p className="text-sm mt-1">
                Search by compound name, drug name, or ChEMBL identifier
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
