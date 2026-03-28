"use client";

import { useState, useEffect } from "react";
import {
  Bug, Sparkles, Lightbulb, RefreshCw, ChevronDown, ChevronRight,
  CheckCircle, AlertCircle, Loader2, GitBranch, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ── Types ────────────────────────────────────────────────────────────────────

interface Issue {
  id: string;
  type: string;
  priority: string;
  title: string;
  description: string;
  url: string;
  user: { name: string; email: string } | null;
  timestamp: string;
  githubIssueUrl: string | null;
  githubIssueNumber: number | null;
}

interface AnalysisChange {
  file: string;
  description: string;
  search: string;
  replace: string;
}

interface AnalysisResult {
  analysis: string;
  effort: "small" | "medium" | "large";
  changes: AnalysisChange[];
  reasoning: string;
  commitMessage: string;
  needsFiles?: string[];
}

interface CommitResult {
  file: string;
  success: boolean;
  error?: string;
  commitUrl?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_FILES = [
  { path: "src/app/auth-gate.tsx",               label: "Layout & Sidebar" },
  { path: "src/app/projects/page.tsx",            label: "Projects" },
  { path: "src/app/admin/page.tsx",               label: "Admin" },
  { path: "src/app/services/page.tsx",            label: "Add-on Services" },
  { path: "src/app/design/page.tsx",              label: "Design with AI" },
  { path: "src/components/feedback-widget.tsx",   label: "Feedback Widget" },
  { path: "src/lib/auth-context.tsx",             label: "Authentication" },
  { path: "src/app/settings/page.tsx",            label: "Settings" },
  { path: "src/app/disease-biology/perturbation/page.tsx", label: "Perturbation" },
];

const PRIORITY_STYLE: Record<string, string> = {
  p0: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  p1: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  p2: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  p3: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  bug: Bug,
  enhancement: Sparkles,
  idea: Lightbulb,
};

const EFFORT_COLOR: Record<string, string> = {
  small: "text-green-600 dark:text-green-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  large: "text-red-600 dark:text-red-400",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AgentConsole() {
  const [issues, setIssues]           = useState<Issue[]>([]);
  const [config, setConfig]           = useState({ githubConfigured: false, anthropicConfigured: false, repo: null as string | null });
  const [loadingIssues, setLoading]   = useState(true);
  const [selected, setSelected]       = useState<Issue | null>(null);
  const [selectedFiles, setFiles]     = useState<string[]>(["src/app/auth-gate.tsx"]);
  const [customFile, setCustomFile]   = useState("");
  const [status, setStatus]           = useState<"idle" | "analyzing" | "committing" | "committed" | "error">("idle");
  const [analysis, setAnalysis]       = useState<AnalysisResult | null>(null);
  const [commitResults, setCommits]   = useState<CommitResult[]>([]);
  const [errorMsg, setError]          = useState("");
  const [expanded, setExpanded]       = useState<Set<number>>(new Set([0]));

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/issues");
      const data = await res.json();
      setIssues(data.items ?? []);
      setConfig({
        githubConfigured:   data.githubConfigured,
        anthropicConfigured: data.anthropicConfigured,
        repo: data.repo,
      });
    } catch { setIssues([]); }
    finally  { setLoading(false); }
  };

  useEffect(() => { fetchIssues(); }, []);

  const toggleFile = (p: string) =>
    setFiles((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const addCustom = () => {
    if (customFile.trim() && !selectedFiles.includes(customFile.trim())) {
      setFiles((prev) => [...prev, customFile.trim()]);
      setCustomFile("");
    }
  };

  const reset = () => {
    setStatus("idle");
    setAnalysis(null);
    setCommits([]);
    setError("");
    setExpanded(new Set([0]));
  };

  const selectIssue = (issue: Issue) => {
    setSelected(issue);
    reset();
    // Auto-select likely relevant file based on issue URL
    if (issue.url) {
      try {
        const pathname = new URL(issue.url).pathname;
        const match = DEFAULT_FILES.find((f) => f.path.includes(pathname.replace("/", "").replace(/\//g, "/")));
        if (match && !selectedFiles.includes(match.path)) {
          setFiles((prev) => [match.path, ...prev.filter((p) => p !== match.path)]);
        }
      } catch { /* ignore */ }
    }
  };

  const analyze = async () => {
    if (!selected) return;
    setStatus("analyzing");
    setAnalysis(null);
    setError("");

    try {
      const res = await fetch("/api/admin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue: selected, filePaths: selectedFiles }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Analysis failed");
      }
      const result: AnalysisResult = await res.json();
      if ("error" in result) throw new Error((result as { error: string }).error);
      setAnalysis(result);
      setStatus("idle");
      setExpanded(new Set([0]));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStatus("error");
    }
  };

  const commit = async () => {
    if (!analysis || !selected) return;
    setStatus("committing");

    try {
      const res = await fetch("/api/admin/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changes: analysis.changes,
          commitMessage: analysis.commitMessage,
          issueNumber: selected.githubIssueNumber,
        }),
      });
      const data = await res.json();
      setCommits(data.results ?? []);
      setStatus("committed");
    } catch {
      setError("Commit failed — check console.");
      setStatus("error");
    }
  };

  const toggleChange = (i: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Setup warnings */}
      {!config.anthropicConfigured && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-700 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
          ⚠ Add <code className="font-mono bg-yellow-100 dark:bg-yellow-900 px-1 rounded">ANTHROPIC_API_KEY</code> to .env to enable AI analysis
        </div>
      )}
      {!config.githubConfigured && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-700 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
          ℹ Add <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">GITHUB_TOKEN / GITHUB_OWNER / GITHUB_REPO</code> to enable GitHub sync and auto-commit
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ── Issue Queue ─────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Issue Queue</CardTitle>
                <button onClick={fetchIssues} title="Refresh"
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors">
                  <RefreshCw className={cn("h-3.5 w-3.5", loadingIssues && "animate-spin")} />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingIssues ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : issues.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No open feedback items
                </p>
              ) : (
                <div className="divide-y max-h-[60vh] overflow-y-auto">
                  {issues.map((issue) => {
                    const Icon = TYPE_ICON[issue.type] ?? Bug;
                    const isActive = selected?.id === issue.id;
                    return (
                      <button key={issue.id} onClick={() => selectIssue(issue)}
                        className={cn(
                          "w-full text-left px-4 py-3 hover:bg-accent/50 transition-colors",
                          isActive && "bg-accent"
                        )}>
                        <div className="flex items-start gap-2">
                          <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{issue.title}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase", PRIORITY_STYLE[issue.priority] ?? "bg-muted text-muted-foreground")}>
                                {issue.priority.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(issue.timestamp).toLocaleDateString()}
                              </span>
                              {issue.githubIssueUrl && (
                                <a href={issue.githubIssueUrl} target="_blank" rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[10px] text-primary hover:underline">
                                  #{issue.githubIssueNumber}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Agent Panel ──────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {!selected ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground text-sm">
                ← Select an issue from the queue to begin
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Issue detail */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base leading-snug">{selected.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {selected.type} · {selected.priority.toUpperCase()}
                        {selected.user && ` · ${selected.user.name}`}
                        {selected.url && (() => {
                          try { return ` · ${new URL(selected.url).pathname}`; } catch { return ""; }
                        })()}
                      </p>
                    </div>
                    {selected.githubIssueUrl && (
                      <a href={selected.githubIssueUrl} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 text-muted-foreground hover:text-foreground mt-0.5">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardHeader>
                {selected.description && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.description}</p>
                  </CardContent>
                )}
              </Card>

              {/* File selector */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Files for Claude to Analyze</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-2">
                    {DEFAULT_FILES.map((f) => (
                      <label key={f.path}
                        className="flex items-center gap-2 text-xs cursor-pointer rounded px-2 py-1.5 hover:bg-accent">
                        <input type="checkbox"
                          checked={selectedFiles.includes(f.path)}
                          onChange={() => toggleFile(f.path)}
                          className="rounded shrink-0" />
                        <span className="truncate">
                          <span className="font-medium">{f.label}</span>
                          <span className="text-muted-foreground ml-1 font-mono hidden sm:inline">
                            {f.path.split("/").pop()}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Custom file input */}
                  <div className="flex gap-2 pt-1">
                    <input type="text" value={customFile}
                      onChange={(e) => setCustomFile(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCustom()}
                      placeholder="src/app/custom/page.tsx"
                      className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-ring" />
                    <button onClick={addCustom}
                      className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent transition-colors">
                      Add
                    </button>
                  </div>

                  {/* Show added custom files */}
                  {selectedFiles
                    .filter((f) => !DEFAULT_FILES.some((d) => d.path === f))
                    .map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs">
                        <span className="font-mono flex-1 truncate text-muted-foreground">{f}</span>
                        <button onClick={() => toggleFile(f)}
                          className="text-destructive hover:underline shrink-0">remove</button>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Analyze button */}
              {status !== "committed" && (
                <button onClick={analyze}
                  disabled={status === "analyzing" || !config.anthropicConfigured || selectedFiles.length === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 font-medium text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors">
                  {status === "analyzing"
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing with Claude…</>
                    : <>🤖 Analyze with Claude</>}
                </button>
              )}

              {/* Error */}
              {status === "error" && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Analysis result */}
              {analysis && status !== "committing" && status !== "committed" && (
                <div className="space-y-3">
                  {/* Summary */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Claude&apos;s Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">{analysis.analysis}</p>
                      <p className="text-xs text-muted-foreground">{analysis.reasoning}</p>
                      <div className="flex gap-2 flex-wrap text-xs">
                        <span className={cn("font-medium", EFFORT_COLOR[analysis.effort])}>
                          {analysis.effort.charAt(0).toUpperCase() + analysis.effort.slice(1)} effort
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">
                          {analysis.changes.length} file{analysis.changes.length !== 1 ? "s" : ""} to change
                        </span>
                      </div>

                      {analysis.needsFiles && analysis.needsFiles.length > 0 && (
                        <div className="rounded-md border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 px-3 py-2 text-xs text-yellow-800 dark:text-yellow-200">
                          Claude needs more files to complete the analysis. Add these above and re-analyze:
                          <ul className="mt-1 font-mono list-disc list-inside">
                            {analysis.needsFiles.map((f) => <li key={f}>{f}</li>)}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Proposed changes */}
                  {analysis.changes.map((change, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-0">
                        <button onClick={() => toggleChange(i)}
                          className="flex items-start justify-between w-full text-left gap-2">
                          <div className="min-w-0">
                            <p className="text-[11px] font-mono text-muted-foreground truncate">{change.file}</p>
                            <p className="text-sm font-medium mt-0.5">{change.description}</p>
                          </div>
                          {expanded.has(i)
                            ? <ChevronDown className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                            : <ChevronRight className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />}
                        </button>
                      </CardHeader>
                      {expanded.has(i) && (
                        <CardContent className="space-y-2 pt-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1">Remove</p>
                            <pre className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-100 p-3 text-[11px] overflow-x-auto whitespace-pre-wrap">{change.search}</pre>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">Add</p>
                            <pre className="rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100 p-3 text-[11px] overflow-x-auto whitespace-pre-wrap">{change.replace}</pre>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}

                  {/* Commit message preview */}
                  <div className="rounded-lg border px-3 py-2.5 text-xs">
                    <span className="text-muted-foreground">Commit message: </span>
                    <span className="font-mono">{analysis.commitMessage}</span>
                  </div>

                  {/* Deploy button */}
                  {analysis.changes.length > 0 && (
                    <button onClick={commit}
                      disabled={!config.githubConfigured}
                      title={!config.githubConfigured ? "GitHub not configured — cannot commit" : ""}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-green-600 hover:bg-green-700 text-white py-3.5 font-medium text-sm disabled:opacity-50 transition-colors">
                      <GitBranch className="h-4 w-4" />
                      {config.githubConfigured
                        ? "Approve & Deploy to Production"
                        : "GitHub not configured (read-only preview)"}
                    </button>
                  )}
                </div>
              )}

              {/* Committing spinner */}
              {status === "committing" && (
                <Card>
                  <CardContent className="py-10 flex flex-col items-center gap-3 text-sm text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <div className="text-center">
                      <p className="font-medium">Committing to GitHub…</p>
                      <p className="text-xs mt-1">Vercel will pick up the push and build automatically</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Committed results */}
              {status === "committed" && (
                <div className="space-y-3">
                  {commitResults.map((r, i) => (
                    <Card key={i} className={r.success ? "border-green-200 dark:border-green-800" : "border-destructive/40"}>
                      <CardContent className="py-4 flex items-start gap-3">
                        {r.success
                          ? <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                          : <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-muted-foreground truncate">{r.file}</p>
                          {r.success ? (
                            <>
                              <p className="text-sm font-medium text-green-700 dark:text-green-300">Committed ✓</p>
                              {r.commitUrl && (
                                <a href={r.commitUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                                  View on GitHub <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </>
                          ) : (
                            <p className="text-sm text-destructive">{r.error}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {commitResults.every((r) => r.success) && (
                    <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 px-4 py-3 text-sm text-green-800 dark:text-green-200">
                      <p className="font-semibold">🚀 Deployed!</p>
                      <p className="text-xs mt-0.5">
                        Vercel is building — production will update in ~60 seconds.
                        {selected?.githubIssueNumber && " GitHub issue closed automatically."}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => { reset(); setSelected(null); fetchIssues(); }}
                    className="w-full rounded-lg border px-4 py-2.5 text-sm hover:bg-accent transition-colors">
                    ← Back to Queue
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
