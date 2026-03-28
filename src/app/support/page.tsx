"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

// ── Seed data ─────────────────────────────────────────────────────────────

const SEED_TICKETS: Ticket[] = [
  { id: "FB-001", type: "bug", priority: "p1", title: "Models page Install button misaligned on Safari",
    description: "The Install/Connect buttons appear bottom-left instead of bottom of card.",
    url: "/models", pageTitle: "Foundation Models",
    user: { name: "Dr. Jake Chen", email: "jakechen@gmail.com" },
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    status: "in-progress", assignedTo: "support@sdd.ai",
    githubIssueUrl: null, githubIssueNumber: null },
  { id: "FB-002", type: "enhancement", priority: "p2", title: "Add dark-mode toggle to mobile nav",
    description: "The dark/light toggle is only in the sidebar footer, not accessible on mobile.",
    url: "/projects", pageTitle: "Projects",
    user: { name: "Dr. Jake Chen", email: "jakechen@gmail.com" },
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: "open", githubIssueUrl: null, githubIssueNumber: null },
  { id: "FB-003", type: "praise", priority: "p3", title: "Love the A1-A10 hierarchy visualization!",
    description: "The multi-scale model pipeline is exactly what we needed for the SPARC grant proposal.",
    url: "/models", pageTitle: "Foundation Models",
    user: { name: "Dr. Jake Chen", email: "jakechen@gmail.com" },
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    status: "closed", resolvedAt: new Date(Date.now() - 3600000 * 40).toISOString(),
    resolution: "Thank you! Noted for the team. 🙌",
    githubIssueUrl: null, githubIssueNumber: null },
];

// ── Docs content ──────────────────────────────────────────────────────────

const DOCS = [
  { id: "getting-started", category: "Quickstart", icon: "🚀", title: "Getting Started", description: "Set up your account, connect your first MCP tool, and run a compound screen in under 10 minutes.", href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/docs/getting-started.md", tags: ["beginner"] },
  { id: "roles", category: "Administration", icon: "🔐", title: "Roles & Permissions", description: "Owner, Admin, TechSupport, Developer, User — understand what each role can and cannot do.", href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/docs/roles-and-permissions.md", tags: ["admin"] },
  { id: "ownership", category: "Administration", icon: "🔑", title: "Ownership Transfer", description: "Transfer platform ownership with the 24-hour cooling-off safeguard and how to cancel.", href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/docs/ownership-transfer.md", tags: ["admin"] },
  { id: "architecture", category: "Technical", icon: "🏛️", title: "Platform Architecture", description: "Next.js 14, Vercel, React 18, Tailwind CSS, MCP integrations — how it all fits together.", href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/docs/platform-architecture.md", tags: ["developer"] },
  { id: "api-ref", category: "Technical", icon: "📡", title: "API Reference", description: "REST endpoints for assistant, feedback, OAuth popups — request/response shapes and examples.", href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/docs/api-reference.md", tags: ["developer"] },
  { id: "releases", category: "Updates", icon: "📋", title: "Release Notes", description: "Full changelog — every feature, fix, and architectural change since v1.100.", href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/RELEASES.md", tags: ["all"] },
  { id: "plugins", category: "Integrations", icon: "🔌", title: "Plugin & MCP Guide", description: "How to install MCP servers, configure API plugins, and build your own tool integrations.", href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/docs/plugins.md", tags: ["developer"] },
  { id: "models", category: "Science", icon: "🧬", title: "A1-A10 Model Hierarchy", description: "The AIDD 2.0 multi-scale framework — from gene targets to whole-population health models.", href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/docs/model-hierarchy.md", tags: ["science"] },
  { id: "security", category: "Compliance", icon: "🛡️", title: "Security & HIPAA", description: "Platform security controls, HIPAA compliance checklist, and data handling policies.", href: "https://github.com/aimed-lab/smartdrugdiscovery/blob/main/docs/security.md", tags: ["admin"] },
];

const DOC_CATEGORIES = Array.from(new Set(DOCS.map((d) => d.category)));

// ── Training library ──────────────────────────────────────────────────────

const TRAINING = [
  { id: "t1", type: "video", icon: "▶", duration: "12 min", title: "Platform Overview", description: "End-to-end walkthrough of SmartDrugDiscovery from login to your first AI-assisted screen.", level: "Beginner", color: "bg-blue-500" },
  { id: "t2", type: "video", icon: "▶", duration: "8 min",  title: "Configuring MCP Servers", description: "Install ChEMBL, PubMed, and Open Targets MCP tools and run your first queries.", level: "Intermediate", color: "bg-green-500" },
  { id: "t3", type: "video", icon: "▶", duration: "22 min", title: "AIDD 2.0 Multi-Scale Modeling", description: "Deep dive into the A1-A10 hierarchy and how to assign validation models to a project.", level: "Advanced", color: "bg-purple-500" },
  { id: "t4", type: "webinar", icon: "🎙", duration: "45 min", title: "Drug Discovery Pipeline with AI Agents", description: "Recorded webinar: using local and remote AI agents to automate DMBT cycle steps.", level: "Intermediate", color: "bg-orange-500" },
  { id: "t5", type: "case-study", icon: "📄", duration: "Read", title: "EGFR Inhibitor Campaign Case Study", description: "How Dr. Jake Chen's lab used SmartDrugDiscovery for the SPARC grant EGFR program — from target to lead.", level: "All", color: "bg-teal-500" },
  { id: "t6", type: "case-study", icon: "📄", duration: "Read", title: "KRAS G12C Virtual Screening", description: "Using ChEMBL MCP + AlphaFold Docker to screen 50,000 compounds in 4 hours.", level: "Advanced", color: "bg-red-500" },
  { id: "t7", type: "video", icon: "▶", duration: "15 min", title: "Role-Based Access Control Setup", description: "Configure module visibility per role for your enterprise team with the Access Control panel.", level: "Beginner", color: "bg-blue-500" },
  { id: "t8", type: "webinar", icon: "🎙", duration: "30 min", title: "FAIR Plugin Ecosystem", description: "Recorded webinar: adding MCP, Docker, and Jupyter plugins while staying FAIR-compliant.", level: "Intermediate", color: "bg-green-500" },
];

const TRAINING_TYPES = ["all", "video", "webinar", "case-study"];

// ── External portals ──────────────────────────────────────────────────────

const PORTALS = [
  { id: "p1", category: "Community", icon: "💬", title: "GitHub Discussions", description: "Ask questions, share ideas, and connect with other SmartDrugDiscovery users.", href: "https://github.com/aimed-lab/smartdrugdiscovery/discussions", badge: "Open" },
  { id: "p2", category: "Community", icon: "🐛", title: "GitHub Issues", description: "Report bugs, track known issues, and follow feature development.", href: "https://github.com/aimed-lab/smartdrugdiscovery/issues", badge: "Open" },
  { id: "p3", category: "Research", icon: "🎓", title: "UAB Systems Pharmacology", description: "Research center homepage — publications, collaborations, and lab members.", href: "https://www.uab.edu/medicine/pharmacology/systems-pharmacology", badge: "External" },
  { id: "p4", category: "Research", icon: "📚", title: "PubMed — AIDD 2.0 Papers", description: "Literature search for AI-assisted drug discovery publications from the research group.", href: "https://pubmed.ncbi.nlm.nih.gov/?term=Chen+JY+drug+discovery+AI", badge: "External" },
  { id: "p5", category: "Standards", icon: "📋", title: "FAIR Data Principles", description: "GO FAIR initiative — Findable, Accessible, Interoperable, Reusable framework.", href: "https://www.go-fair.org/fair-principles/", badge: "External" },
  { id: "p6", category: "Standards", icon: "⚕️", title: "ICH E6 (GCP) Guidelines", description: "Good Clinical Practice guidelines referenced in the Regulatory module.", href: "https://database.ich.org/sites/default/files/E6_R2_Addendum.pdf", badge: "Regulatory" },
  { id: "p7", category: "Tools", icon: "🧪", title: "ChEMBL Database", description: "Query bioactivity data directly at EMBL-EBI ChEMBL portal.", href: "https://www.ebi.ac.uk/chembl/", badge: "External" },
  { id: "p8", category: "Tools", icon: "🧬", title: "AlphaFold Protein Structure DB", description: "Structure predictions for human and model organism proteomes.", href: "https://alphafold.ebi.ac.uk/", badge: "External" },
];

const PORTAL_CATEGORIES = Array.from(new Set(PORTALS.map((p) => p.category)));

// ── Component ─────────────────────────────────────────────────────────────

export default function SupportPage() {
  const { user } = useAuth();
  const canTriage = hasRole(user?.role, "TechSupport");
  const canDelete = hasRole(user?.role, "Admin");

  // ── Ticket triage state ────────────────────────────────────────────────
  const [tickets,        setTickets]        = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [statusFilter,   setStatusFilter]   = useState<string>("all");
  const [typeFilter,     setTypeFilter]     = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selected,       setSelected]       = useState<Ticket | null>(null);
  const [resolution,     setResolution]     = useState("");
  const [saving,         setSaving]         = useState(false);
  const [banner,         setBanner]         = useState("");

  // ── Docs / training state ──────────────────────────────────────────────
  const [docSearch,    setDocSearch]    = useState("");
  const [docCat,       setDocCat]       = useState("All");
  const [trainingType, setTrainingType] = useState("all");
  const [trainingSearch, setTrainingSearch] = useState("");

  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
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
      setLoadingTickets(false);
    }
  }, [statusFilter, typeFilter, priorityFilter]);

  useEffect(() => { if (canTriage) fetchTickets(); }, [canTriage, fetchTickets]);

  async function updateTicket(id: string, updates: { status?: TicketStatus; resolution?: string; assignedTo?: string }) {
    setSaving(true);
    try {
      await fetch("/api/feedback", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...updates }) });
      setTickets((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...updates } : null);
      setBanner("✓ Ticket updated"); setTimeout(() => setBanner(""), 3000);
    } finally { setSaving(false); }
  }

  async function deleteTicket(id: string) {
    if (!confirm("Permanently delete this ticket? This cannot be undone.")) return;
    await fetch("/api/feedback", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setTickets((prev) => prev.filter((t) => t.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  // Filtered docs
  const filteredDocs = DOCS.filter((d) => {
    const matchCat = docCat === "All" || d.category === docCat;
    const matchSearch = !docSearch || d.title.toLowerCase().includes(docSearch.toLowerCase()) || d.description.toLowerCase().includes(docSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  // Filtered training
  const filteredTraining = TRAINING.filter((t) => {
    const matchType = trainingType === "all" || t.type === trainingType;
    const matchSearch = !trainingSearch || t.title.toLowerCase().includes(trainingSearch.toLowerCase()) || t.description.toLowerCase().includes(trainingSearch.toLowerCase());
    return matchType && matchSearch;
  });

  // My tickets (filter by current user email)
  const myTickets = SEED_TICKETS.filter((t) => !user?.email || t.user?.email === user.email);

  // Summary counts
  const openCount       = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in-progress").length;
  const resolvedCount   = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;
  const p0Count         = tickets.filter((t) => t.priority === "p0").length;

  const STATUSES:  (TicketStatus   | "all")[] = ["all", "open", "in-progress", "resolved", "closed", "wont-fix"];
  const TYPES:     (TicketType     | "all")[] = ["all", "bug", "enhancement", "idea", "question", "praise"];
  const PRIORITIES:(TicketPriority | "all")[] = ["all", "p0", "p1", "p2", "p3"];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Support Center</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Documentation, training, resources, and ticket management
        </p>
      </div>

      <Tabs defaultValue={canTriage ? "dashboard" : "help"} className="space-y-6">
        <TabsList>
          <TabsTrigger value="help">Help Center</TabsTrigger>
          <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
          {canTriage && <TabsTrigger value="dashboard">Admin Dashboard</TabsTrigger>}
        </TabsList>

        {/* ── HELP CENTER ──────────────────────────────────────────────── */}
        <TabsContent value="help" className="space-y-8">

          {/* Documentation */}
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-semibold">📖 Documentation</h2>
                <p className="text-xs text-muted-foreground">GitHub-sourced guides, references, and release notes</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Search docs…"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-52"
                />
                <div className="flex gap-1 flex-wrap">
                  {["All", ...DOC_CATEGORIES].map((c) => (
                    <button key={c} onClick={() => setDocCat(c)}
                      className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                        docCat === c ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent border-input")}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDocs.map((doc) => (
                <a key={doc.id} href={doc.href} target="_blank" rel="noopener noreferrer"
                  className="rounded-lg border p-4 hover:bg-accent hover:shadow-sm transition-all group space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{doc.icon}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors">{doc.title}</p>
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{doc.category}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-snug">{doc.description}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-primary/70 group-hover:text-primary">GitHub ↗</p>
                </a>
              ))}
              {filteredDocs.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-3 py-6 text-center">No docs match your search.</p>
              )}
            </div>
          </section>

          {/* Training Library */}
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-semibold">🎓 Training Library</h2>
                <p className="text-xs text-muted-foreground">Video tutorials, recorded webinars, and case studies</p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <input
                  type="text"
                  placeholder="Search training…"
                  value={trainingSearch}
                  onChange={(e) => setTrainingSearch(e.target.value)}
                  className="rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring w-48"
                />
                <div className="flex gap-1">
                  {TRAINING_TYPES.map((tt) => (
                    <button key={tt} onClick={() => setTrainingType(tt)}
                      className={cn("rounded-full px-2.5 py-1 text-xs font-medium transition-colors border",
                        trainingType === tt ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent border-input")}>
                      {tt === "all" ? "All" : tt === "case-study" ? "Case Studies" : tt.charAt(0).toUpperCase() + tt.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {filteredTraining.map((item) => (
                <div key={item.id} className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                  {/* Thumbnail placeholder */}
                  <div className={cn("h-28 flex items-center justify-center", item.color)}>
                    <span className="text-5xl text-white/80">{item.icon}</span>
                  </div>
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] capitalize">{item.type.replace("-", " ")}</span>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{item.level}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{item.duration}</span>
                    </div>
                    <p className="text-sm font-semibold leading-snug">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{item.description}</p>
                    <button className="mt-1 text-xs text-primary hover:underline">
                      {item.type === "video" ? "▶ Watch" : item.type === "webinar" ? "▶ Watch recording" : "→ Read case study"}
                    </button>
                  </div>
                </div>
              ))}
              {filteredTraining.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-4 py-6 text-center">No training items match your search.</p>
              )}
            </div>
          </section>

          {/* Online Portals */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">🌐 Online Portals & Resources</h2>
              <p className="text-xs text-muted-foreground">Community, research tools, standards, and external databases</p>
            </div>
            {PORTAL_CATEGORIES.map((cat) => (
              <div key={cat} className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{cat}</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {PORTALS.filter((p) => p.category === cat).map((portal) => (
                    <a key={portal.id} href={portal.href} target="_blank" rel="noopener noreferrer"
                      className="rounded-lg border p-3 hover:bg-accent hover:shadow-sm transition-all flex items-start gap-2.5 group">
                      <span className="text-xl shrink-0">{portal.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">{portal.title}</p>
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] shrink-0">{portal.badge}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">{portal.description}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </TabsContent>

        {/* ── MY TICKETS ───────────────────────────────────────────────── */}
        <TabsContent value="my-tickets" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">My Submitted Tickets</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Track the status of your feedback and bug reports</p>
          </div>
          {myTickets.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center space-y-2">
              <p className="text-2xl">📭</p>
              <p className="text-sm text-muted-foreground">You haven&apos;t submitted any tickets yet.</p>
              <p className="text-xs text-muted-foreground">Use the <strong>Bot button</strong> (bottom-right) → Feedback tab to report issues or ideas.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTickets.map((t) => (
                <div key={t.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-lg">{TYPE_ICON[t.type]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{t.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.id} · {new Date(t.timestamp).toLocaleDateString()} · {t.pageTitle || t.url}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", PRIORITY_COLOR[t.priority])}>
                        {t.priority.toUpperCase()}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COLOR[t.status])}>
                        {STATUS_LABEL[t.status]}
                      </span>
                    </div>
                  </div>
                  {t.description && <p className="text-xs text-muted-foreground leading-relaxed pl-7">{t.description}</p>}
                  {t.resolution && (
                    <div className="ml-7 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2 text-xs text-green-800 dark:text-green-300">
                      <span className="font-medium">Resolution: </span>{t.resolution}
                    </div>
                  )}
                  {t.assignedTo && (
                    <p className="text-[11px] text-muted-foreground pl-7">Assigned to {t.assignedTo}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── ADMIN DASHBOARD ──────────────────────────────────────────── */}
        {canTriage && (
          <TabsContent value="dashboard" className="space-y-5">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="text-lg font-semibold">Ticket Triage Dashboard</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Review, assign, and resolve all user-submitted tickets</p>
              </div>
              <button onClick={fetchTickets} className="rounded-md px-3 py-1.5 text-sm border bg-background hover:bg-accent transition-colors">
                ↻ Refresh
              </button>
            </div>

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
              {[
                { label: "Status",   value: statusFilter,   set: setStatusFilter,   opts: STATUSES,   fmt: (v: string) => v === "all" ? "All" : STATUS_LABEL[v as TicketStatus] },
                { label: "Type",     value: typeFilter,     set: setTypeFilter,     opts: TYPES,      fmt: (v: string) => v === "all" ? "All" : v },
                { label: "Priority", value: priorityFilter, set: setPriorityFilter, opts: PRIORITIES, fmt: (v: string) => v === "all" ? "All" : PRIORITY_LABEL[v as TicketPriority] },
              ].map(({ label, value, set, opts, fmt }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <select value={value} onChange={(e) => set(e.target.value)}
                    className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-ring">
                    {opts.map((o) => <option key={o} value={o}>{fmt(o)}</option>)}
                  </select>
                </div>
              ))}
              <span className="text-xs text-muted-foreground ml-auto">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Ticket list + detail panel */}
            <div className={cn("flex gap-4", selected ? "flex-col lg:flex-row" : "")}>
              <div className={cn("space-y-2", selected ? "lg:w-[55%] shrink-0" : "w-full")}>
                {loadingTickets ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">Loading tickets…</div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">No tickets match the current filters.</div>
                ) : (
                  tickets.map((t) => (
                    <div key={t.id} onClick={() => { setSelected(t); setResolution(t.resolution ?? ""); }}
                      className={cn("rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors",
                        selected?.id === t.id && "ring-2 ring-primary bg-accent/30",
                        t.priority === "p0" && "border-red-300 dark:border-red-800")}>
                      <div className="flex items-start gap-2">
                        <span className="text-base shrink-0 mt-0.5">{TYPE_ICON[t.type]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", PRIORITY_COLOR[t.priority])}>{t.priority.toUpperCase()}</span>
                            <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", STATUS_COLOR[t.status])}>{STATUS_LABEL[t.status]}</span>
                            {t.assignedTo && <span className="text-[10px] text-muted-foreground">→ {t.assignedTo}</span>}
                          </div>
                          <p className="text-sm font-medium truncate">{t.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] text-muted-foreground">{t.id}</span>
                            <span className="text-[10px] text-muted-foreground">{t.user?.name ?? "Anonymous"}</span>
                            <span className="text-[10px] text-muted-foreground">{new Date(t.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {canDelete && (
                          <button onClick={(e) => { e.stopPropagation(); deleteTicket(t.id); }} title="Delete"
                            className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-xs">✕</button>
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
                    <div className="flex flex-wrap gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", PRIORITY_COLOR[selected.priority])}>{PRIORITY_LABEL[selected.priority]}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLOR[selected.status])}>{STATUS_LABEL[selected.status]}</span>
                      <span className="rounded-full px-2 py-0.5 text-xs bg-secondary text-secondary-foreground">{TYPE_ICON[selected.type]} {selected.type}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Submitted by</p>
                      <p className="text-sm">{selected.user?.name ?? "Anonymous"} <span className="text-muted-foreground text-xs">({selected.user?.email ?? "—"})</span></p>
                      <p className="text-xs text-muted-foreground mt-0.5">on {selected.pageTitle || selected.url}</p>
                    </div>
                    {selected.description && (
                      <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Description</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.description}</p>
                      </div>
                    )}
                    {selected.githubIssueUrl && (
                      <a href={selected.githubIssueUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                        🔗 GitHub #{selected.githubIssueNumber}
                      </a>
                    )}
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Update Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(["open", "in-progress", "resolved", "closed", "wont-fix"] as TicketStatus[]).map((s) => (
                          <button key={s} onClick={() => updateTicket(selected.id, { status: s })} disabled={saving}
                            className={cn("rounded-full px-2.5 py-1 text-xs font-medium transition-colors border",
                              selected.status === s ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent border-input")}>
                            {STATUS_LABEL[s]}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Assign to</p>
                      <div className="flex gap-2">
                        <input type="email" value={selected.assignedTo ?? ""} placeholder="support@yourorg.com"
                          onChange={(e) => setSelected((prev) => prev ? { ...prev, assignedTo: e.target.value } : null)}
                          className="flex-1 rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
                        <button onClick={() => updateTicket(selected.id, { assignedTo: selected.assignedTo })} disabled={saving}
                          className="rounded-md px-3 py-1.5 text-xs font-medium bg-secondary hover:bg-secondary/80 transition-colors">Save</button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Resolution note</p>
                      <textarea rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)}
                        placeholder="Describe how this was resolved…"
                        className="w-full rounded-md border bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
                      <button onClick={() => updateTicket(selected.id, { resolution })} disabled={saving || !resolution.trim()}
                        className="mt-2 rounded-md px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors">
                        {saving ? "Saving…" : "Save Resolution"}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
