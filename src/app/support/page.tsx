"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { hasRole } from "@/lib/roles";

// ── Types (mirrors api/feedback/route.ts) ─────────────────────────────────

type TicketStatus   = "open" | "in-progress" | "resolved" | "closed" | "wont-fix";
type TicketType     = "bug" | "enhancement" | "idea" | "question" | "praise";
type TicketPriority = "p0" | "p1" | "p2" | "p3";

interface Ticket {
  id: string;
  type: TicketType;
  priority: TicketPriority;
  title: string;
  description: string;
  url: string;
  pageTitle: string;
  user: { name: string; email: string } | null;
  timestamp: string;
  status: TicketStatus;
  assignedTo?: string;
  resolvedAt?: string;
  resolution?: string;
  githubIssueUrl: string | null;
  githubIssueNumber: number | null;
}

// ── Constants ─────────────────────────────────────────────────────────────

const TYPE_ICON: Record<TicketType, string>   = { bug: "🐛", enhancement: "✨", idea: "💡", question: "❓", praise: "🌟" };
const PRIORITY_COLOR: Record<TicketPriority, string> = {
  p0: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  p1: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  p2: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  p3: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};
const PRIORITY_LABEL: Record<TicketPriority, string> = { p0: "P0 Critical", p1: "P1 High", p2: "P2 Medium", p3: "P3 Low" };

const STATUS_COLOR: Record<TicketStatus, string> = {
  "open":        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "in-progress": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "resolved":    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "closed":      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  "wont-fix":    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};
const STATUS_LABEL: Record<TicketStatus, string> = {
  "open": "Open", "in-progress": "In Progress", "resolved": "Resolved",
  "closed": "Closed", "wont-fix": "Won't Fix",
};

// ── Seed data for demo (used if /api/feedback returns empty) ─────────────

const SEED_TICKETS: Ticket[] = [
  {
    id: "FB-001",
    type: "bug",
    priority: "p1",
    title: "Models page Install button misaligned on Safari",
    description: "The Install/Connect buttons appear bottom-left instead of bottom of card.",
    url: "/models",
    pageTitle: "Foundation Models",
    user: { name: "Dr. Jake Chen", email: "jakechen@gmail.com" },
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "in-progress",
    assignedTo: "support@sdd.ai",
    githubIssueUrl: null,
    githubIssueNumber: null,
  },
  {
    id: "FB-002",
    type: "enhancement",
    priority: "p2",
    title: "Add dark-mode toggle to mobile nav",
    description: "The dark/light toggle is only in the sidebar footer, not accessible on mobile.",
    url: "/projects",
    pageTitle: "Projects",
    user: { name: "Dr. Jake Chen", email: "jakechen@gmail.com" },
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: "open",
    githubIssueUrl: null,
    githubIssueNumber: null,
  },
  {
    id: "FB-003",
    type: "praise",
    priority: "p3",
    title: "Love the A1-A10 hierarchy visualization!",
    description: "The multi-scale model pipeline is exactly what we needed for the SPARC grant proposal.",
    url: "/models",
    pageTitle: "Foundation Models",
    user: { name: "Dr. Jake Chen", email: "jakechen@gmail.com" },
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: "closed",
    resolvedAt: new Date(Date.now() - 3600000 * 40).toISOString(),
    resolution: "Thank you! Noted for the team. 🙌",
    githubIssueUrl: null,
    githubIssueNumber: null,
  },
];

// ── Component ─────────────────────────────────────────────────────────────

export default function SupportPage() {
  const { user } = useAuth();
  const [tickets,      setTickets]      = useState<Ticket[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter,   setTypeFilter]   = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selected,     setSelected]     = useState<Ticket | null>(null);
  const [resolution,   setResolution]   = useState("");
  const [saving,       setSaving]       = useState(false);
  const [banner,       setBanner]       = useState("");

  // Access check
  const canView   = hasRole(user?.role, "TechSupport");
  const canDelete = hasRole(user?.role, "Admin");

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter   !== "all") params.set("status",   statusFilter);
      if (typeFilter     !== "all") params.set("type",     typeFilter);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      const res  = await fetch(`/api/feedback?${params}`);
      const data = await res.json() as Ticket[];
      setTickets(data.length ? data : SEED_TICKETS);
    } catch {
      setTickets(SEED_TICKETS);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, priorityFilter]);

  useEffect(() => { if (canView) fetchTickets(); }, [canView, fetchTickets]);

  async function updateTicket(id: string, updates: { status?: TicketStatus; resolution?: string; assignedTo?: string }) {
    setSaving(true);
    try {
      await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      setTickets((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...updates } : null);
      setBanner("✓ Ticket updated");
      setTimeout(() => setBanner(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTicket(id: string) {
    if (!confirm("Permanently delete this ticket? This cannot be undone.")) return;
    await fetch("/api/feedback", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTickets((prev) => prev.filter((t) => t.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-5xl">🔒</p>
        <p className="text-lg font-semibold">Tech Support role required</p>
        <p className="text-sm text-muted-foreground">This page is visible to TechSupport, Admin, and Owner roles only.</p>
      </div>
    );
  }

  const STATUSES: (TicketStatus | "all")[] = ["all", "open", "in-progress", "resolved", "closed", "wont-fix"];
  const TYPES:    (TicketType   | "all")[] = ["all", "bug", "enhancement", "idea", "question", "praise"];
  const PRIORITIES:(TicketPriority|"all")[]= ["all", "p0", "p1", "p2", "p3"];

  // Summary counts
  const openCount       = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in-progress").length;
  const resolvedCount   = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;
  const p0Count         = tickets.filter((t) => t.priority === "p0").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Support Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Triage and resolve user feedback tickets</p>
        </div>
        <button
          onClick={fetchTickets}
          className="rounded-md px-3 py-1.5 text-sm border bg-background hover:bg-accent transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Save banner */}
      {banner && (
        <div className="rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-4 py-2 text-sm font-medium">
          {banner}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Open",        value: openCount,       color: "text-blue-600" },
          { label: "In Progress", value: inProgressCount, color: "text-purple-600" },
          { label: "Resolved",    value: resolvedCount,   color: "text-green-600" },
          { label: "P0 Critical", value: p0Count,         color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-3">
              <p className={cn("text-3xl font-bold", color)}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s === "all" ? "All" : STATUS_LABEL[s as TicketStatus]}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Type</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {TYPES.map((t) => <option key={t} value={t}>{t === "all" ? "All" : t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Priority</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {PRIORITIES.map((p) => <option key={p} value={p}>{p === "all" ? "All" : PRIORITY_LABEL[p as TicketPriority]}</option>)}
          </select>
        </div>
        <span className="text-xs text-muted-foreground ml-auto">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Ticket table + detail panel */}
      <div className={cn("flex gap-4", selected ? "flex-col lg:flex-row" : "")}>
        {/* Ticket list */}
        <div className={cn("space-y-2", selected ? "lg:w-[55%] shrink-0" : "w-full")}>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading tickets…</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No tickets match the current filters.</div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => { setSelected(t); setResolution(t.resolution ?? ""); }}
                className={cn(
                  "rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors",
                  selected?.id === t.id && "ring-2 ring-primary bg-accent/30",
                  t.priority === "p0" && "border-red-300 dark:border-red-800"
                )}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0 mt-0.5">{TYPE_ICON[t.type]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", PRIORITY_COLOR[t.priority])}>
                        {t.priority.toUpperCase()}
                      </span>
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", STATUS_COLOR[t.status])}>
                        {STATUS_LABEL[t.status]}
                      </span>
                      {t.assignedTo && (
                        <span className="text-[10px] text-muted-foreground">→ {t.assignedTo}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground">{t.id}</span>
                      <span className="text-[10px] text-muted-foreground">{t.user?.name ?? "Anonymous"}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(t.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTicket(t.id); }}
                      title="Delete ticket"
                      className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <Card className="lg:flex-1 h-fit">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{selected.title}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{selected.id} · {new Date(selected.timestamp).toLocaleString()}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground shrink-0">✕</button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Meta badges */}
              <div className="flex flex-wrap gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", PRIORITY_COLOR[selected.priority])}>
                  {PRIORITY_LABEL[selected.priority]}
                </span>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLOR[selected.status])}>
                  {STATUS_LABEL[selected.status]}
                </span>
                <span className="rounded-full px-2 py-0.5 text-xs bg-secondary text-secondary-foreground">
                  {TYPE_ICON[selected.type]} {selected.type}
                </span>
              </div>

              {/* Submitter */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Submitted by</p>
                <p className="text-sm">{selected.user?.name ?? "Anonymous"} <span className="text-muted-foreground text-xs">({selected.user?.email ?? "—"})</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">on {selected.pageTitle || selected.url}</p>
              </div>

              {/* Description */}
              {selected.description && (
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.description}</p>
                </div>
              )}

              {/* GitHub issue link */}
              {selected.githubIssueUrl && (
                <a href={selected.githubIssueUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                  🔗 GitHub #{selected.githubIssueNumber}
                </a>
              )}

              {/* Status update */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Update Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["open", "in-progress", "resolved", "closed", "wont-fix"] as TicketStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateTicket(selected.id, { status: s })}
                      disabled={saving}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium transition-colors border",
                        selected.status === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-accent border-input"
                      )}
                    >
                      {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assign */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Assign to</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={selected.assignedTo ?? ""}
                    onChange={(e) => setSelected((prev) => prev ? { ...prev, assignedTo: e.target.value } : null)}
                    placeholder="support@yourorg.com"
                    className="flex-1 rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    onClick={() => updateTicket(selected.id, { assignedTo: selected.assignedTo })}
                    disabled={saving}
                    className="rounded-md px-3 py-1.5 text-xs font-medium bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Resolution note */}
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Resolution note</p>
                <textarea
                  rows={3}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how this was resolved…"
                  className="w-full rounded-md border bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <button
                  onClick={() => updateTicket(selected.id, { resolution })}
                  disabled={saving || !resolution.trim()}
                  className="mt-2 rounded-md px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
                  {saving ? "Saving…" : "Save Resolution"}
                </button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
