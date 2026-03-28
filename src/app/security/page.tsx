"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { hasRole } from "@/lib/roles";

// ── Types ─────────────────────────────────────────────────────────────────

type ComplianceStatus  = "compliant" | "partial" | "non-compliant" | "not-applicable";
type CertStatus        = "active" | "expiring-soon" | "expired" | "pending";
type ReportAudience    = "roles" | "project" | "individual";
type SecurityCategory  = "app" | "ai" | "hipaa" | "data" | "infra";

interface ComplianceCheck {
  id: string;
  category: SecurityCategory;
  control: string;
  description: string;
  status: ComplianceStatus;
  lastChecked: string;
  assignedTo: string;
  remediation?: string;
}

interface Certificate {
  id: string;
  name: string;
  issuer: string;
  category: SecurityCategory;
  status: CertStatus;
  issuedDate: string;
  expiryDate: string;
  thumbprint: string;
}

interface SecurityReport {
  id: string;
  title: string;
  category: SecurityCategory;
  generatedAt: string;
  generatedBy: string;
  summary: string;
  score: number;          // 0-100
  findings: number;       // total findings
  critical: number;
  high: number;
  medium: number;
  low: number;
  sharedWith: { type: ReportAudience; value: string }[];
}

// ── Static data ───────────────────────────────────────────────────────────

const complianceChecks: ComplianceCheck[] = [
  // App Security
  { id: "AS-001", category: "app", control: "Authentication", description: "Multi-factor authentication enforced for all admin accounts", status: "compliant", lastChecked: "2026-03-28", assignedTo: "Dev Team" },
  { id: "AS-002", category: "app", control: "Session Management", description: "Sessions expire after 8 hours of inactivity; tokens rotated on login", status: "compliant", lastChecked: "2026-03-28", assignedTo: "Dev Team" },
  { id: "AS-003", category: "app", control: "Input Validation", description: "All API endpoints validated with Zod schemas; SQL injection protections active", status: "compliant", lastChecked: "2026-03-25", assignedTo: "Dev Team" },
  { id: "AS-004", category: "app", control: "Dependency Scanning", description: "npm audit: 0 critical, 2 moderate vulnerabilities in transitive deps", status: "partial", lastChecked: "2026-03-28", assignedTo: "Dev Team", remediation: "Update next-auth to ≥5.0.0 and esbuild to ≥0.24.0" },
  { id: "AS-005", category: "app", control: "CSP Headers", description: "Content-Security-Policy headers configured on all Vercel deployments", status: "compliant", lastChecked: "2026-03-20", assignedTo: "Dev Team" },
  // AI Security
  { id: "AI-001", category: "ai", control: "Prompt Injection Defense", description: "System prompts hardened; user input never concatenated directly into privileged instructions", status: "compliant", lastChecked: "2026-03-28", assignedTo: "AI Team" },
  { id: "AI-002", category: "ai", control: "API Key Isolation", description: "ANTHROPIC_API_KEY stored as Vercel env var; never exposed to client bundles", status: "compliant", lastChecked: "2026-03-28", assignedTo: "Dev Team" },
  { id: "AI-003", category: "ai", control: "Output Filtering", description: "PII and sensitive compound data scrubbed from AI responses before logging", status: "partial", lastChecked: "2026-03-22", assignedTo: "AI Team", remediation: "Implement regex-based PII filter on assistant route responses" },
  { id: "AI-004", category: "ai", control: "Model Usage Audit", description: "All LLM API calls logged with token counts, user IDs, and timestamps", status: "compliant", lastChecked: "2026-03-28", assignedTo: "AI Team" },
  { id: "AI-005", category: "ai", control: "Rate Limiting", description: "Free tier users limited to 5 AI questions/session; server-side enforcement pending", status: "partial", lastChecked: "2026-03-28", assignedTo: "Dev Team", remediation: "Move rate-limit enforcement to /api/assistant (currently client-side only)" },
  // HIPAA
  { id: "HP-001", category: "hipaa", control: "PHI Identification", description: "No patient health information stored; clinical data uses pseudonymized IDs only", status: "compliant", lastChecked: "2026-03-15", assignedTo: "Compliance Team" },
  { id: "HP-002", category: "hipaa", control: "Data Encryption at Rest", description: "localStorage data not encrypted; Supabase/Postgres with AES-256 planned", status: "partial", lastChecked: "2026-03-28", assignedTo: "Dev Team", remediation: "Migrate to Supabase with column-level encryption for sensitive fields" },
  { id: "HP-003", category: "hipaa", control: "Data Encryption in Transit", description: "All traffic via HTTPS/TLS 1.3; Vercel enforces HSTS", status: "compliant", lastChecked: "2026-03-28", assignedTo: "Dev Team" },
  { id: "HP-004", category: "hipaa", control: "Audit Logs", description: "Role changes, logins, and data exports logged via feedback-log.json and Vercel logs", status: "partial", lastChecked: "2026-03-28", assignedTo: "Dev Team", remediation: "Centralized audit log table in planned DB backend" },
  { id: "HP-005", category: "hipaa", control: "BAA Agreements", description: "Business Associate Agreement with Vercel (hosting) and Anthropic (AI processing)", status: "compliant", lastChecked: "2026-02-01", assignedTo: "Legal Team" },
  // Data Security
  { id: "DS-001", category: "data", control: "Data Residency", description: "Compute and storage on US-East-1 (Vercel/AWS); no data transferred to unauthorized regions", status: "compliant", lastChecked: "2026-03-01", assignedTo: "Infra Team" },
  { id: "DS-002", category: "data", control: "Backup & Recovery", description: "No automated backup currently; feedback-log.json on ephemeral Vercel filesystem", status: "non-compliant", lastChecked: "2026-03-28", assignedTo: "Dev Team", remediation: "Implement daily backup to S3/GCS once DB backend is live" },
  { id: "DS-003", category: "data", control: "Data Retention Policy", description: "User profile data: retained until account deletion. Feedback: 2-year retention.", status: "compliant", lastChecked: "2026-03-15", assignedTo: "Compliance Team" },
  // Infrastructure
  { id: "IN-001", category: "infra", control: "WAF", description: "Vercel Edge Network provides DDoS mitigation and bot protection", status: "compliant", lastChecked: "2026-03-28", assignedTo: "Infra Team" },
  { id: "IN-002", category: "infra", control: "Penetration Testing", description: "Annual pen test scheduled Q4 2026; last test: not yet performed", status: "non-compliant", lastChecked: "2026-01-01", assignedTo: "Security Team", remediation: "Schedule pen test with certified vendor before production launch" },
];

const certificates: Certificate[] = [
  { id: "CERT-001", name: "TLS Certificate — studio.smartdrugdiscovery.org", issuer: "Let's Encrypt (via Vercel)", category: "infra", status: "active", issuedDate: "2026-03-01", expiryDate: "2026-06-01", thumbprint: "A1:B2:C3:D4:E5:F6..." },
  { id: "CERT-002", name: "Anthropic API — Service Agreement", issuer: "Anthropic PBC", category: "ai", status: "active", issuedDate: "2025-01-15", expiryDate: "2026-12-31", thumbprint: "—" },
  { id: "CERT-003", name: "HIPAA BAA — Vercel", issuer: "Vercel Inc.", category: "hipaa", status: "active", issuedDate: "2025-06-01", expiryDate: "2027-06-01", thumbprint: "—" },
  { id: "CERT-004", name: "SOC 2 Type II (Vercel)", issuer: "Vercel Inc.", category: "infra", status: "active", issuedDate: "2025-09-01", expiryDate: "2026-09-01", thumbprint: "—" },
  { id: "CERT-005", name: "Code Signing Certificate", issuer: "DigiCert", category: "app", status: "expiring-soon", issuedDate: "2023-04-01", expiryDate: "2026-04-15", thumbprint: "F1:E2:D3:C4:B5:A6..." },
];

const securityReports: SecurityReport[] = [
  {
    id: "SR-2026-03",
    title: "Monthly Security Posture Report — March 2026",
    category: "app",
    generatedAt: "2026-03-28",
    generatedBy: "Dr. Jake Chen",
    summary: "Overall security posture is Good. 15 of 20 controls compliant. 3 partial, 2 non-compliant items require attention.",
    score: 78,
    findings: 5, critical: 0, high: 2, medium: 3, low: 0,
    sharedWith: [{ type: "roles", value: "Admin" }, { type: "roles", value: "Developer" }],
  },
  {
    id: "SR-2026-AI-01",
    title: "AI Security Assessment — Q1 2026",
    category: "ai",
    generatedAt: "2026-03-15",
    generatedBy: "Dr. Jake Chen",
    summary: "Prompt injection defenses rated strong. Rate limiting needs server-side enforcement. PII filter gap identified.",
    score: 85,
    findings: 2, critical: 0, high: 0, medium: 2, low: 0,
    sharedWith: [{ type: "roles", value: "Admin" }],
  },
  {
    id: "SR-2026-HIPAA-01",
    title: "HIPAA Readiness Assessment — Q1 2026",
    category: "hipaa",
    generatedAt: "2026-02-28",
    generatedBy: "Dr. Jake Chen",
    summary: "Pre-launch HIPAA readiness: encryption at rest gap and audit log centralization are blocking items for production.",
    score: 72,
    findings: 3, critical: 0, high: 2, medium: 1, low: 0,
    sharedWith: [{ type: "roles", value: "Admin" }, { type: "individual", value: "jakechen@gmail.com" }],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<SecurityCategory, string> = {
  app: "App Security", ai: "AI Security", hipaa: "HIPAA", data: "Data Security", infra: "Infrastructure",
};
const CATEGORY_COLOR: Record<SecurityCategory, string> = {
  app:   "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  ai:    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  hipaa: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  data:  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  infra: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};
const STATUS_COLOR: Record<ComplianceStatus, string> = {
  compliant:       "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  partial:         "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  "non-compliant": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  "not-applicable":"bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};
const STATUS_LABEL: Record<ComplianceStatus, string> = {
  compliant: "Compliant", partial: "Partial", "non-compliant": "Non-Compliant", "not-applicable": "N/A",
};
const CERT_STATUS_COLOR: Record<CertStatus, string> = {
  active:          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  "expiring-soon": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  expired:         "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  pending:         "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 85 ? "text-green-600" : score >= 70 ? "text-yellow-600" : "text-red-600";
  const ring  = score >= 85 ? "#22c55e" : score >= 70 ? "#eab308" : "#ef4444";
  const dash  = Math.round((score / 100) * 251); // circumference ≈ 2π×40 = 251
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r="38" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="8" />
        <circle cx="44" cy="44" r="38" fill="none" stroke={ring} strokeWidth="8"
          strokeDasharray={`${Math.round((score/100)*239)} 239`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-lg font-bold leading-none", color)}>{score}</span>
        <span className="text-[9px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

// ── Share report modal ─────────────────────────────────────────────────────

function ShareModal({ report, onClose }: { report: SecurityReport; onClose: () => void }) {
  const [mode, setMode]   = useState<ReportAudience>("roles");
  const [value, setValue] = useState("");
  const [shared, setShared] = useState<{ type: ReportAudience; value: string }[]>(report.sharedWith);

  function addShare() {
    const v = value.trim();
    if (!v) return;
    setShared((prev) => [...prev, { type: mode, value: v }]);
    setValue("");
  }

  function removeShare(idx: number) {
    setShared((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Share Report</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <p className="text-xs text-muted-foreground">{report.title}</p>
        {/* Mode selector */}
        <div className="flex gap-2">
          {(["roles", "project", "individual"] as ReportAudience[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={cn("flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors capitalize",
                mode === m ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent")}>
              {m === "roles" ? "By Role" : m === "project" ? "Project" : "Individual"}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={mode === "roles" ? "Admin / Developer / TechSupport…" : mode === "project" ? "Project name or ID…" : "user@example.com"}
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            onKeyDown={(e) => e.key === "Enter" && addShare()}
          />
          <button onClick={addShare} className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium">Add</button>
        </div>
        {/* Current shared-with list */}
        {shared.length > 0 && (
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {shared.map((s, i) => (
              <div key={i} className="flex items-center justify-between rounded-md bg-secondary px-3 py-1.5">
                <span className="text-xs">
                  <span className="text-muted-foreground capitalize mr-1.5">{s.type}:</span>{s.value}
                </span>
                <button onClick={() => removeShare(i)} className="text-muted-foreground hover:text-red-600 text-xs">✕</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 rounded-md border px-4 py-2 text-sm">Cancel</button>
          <button onClick={onClose} className="flex-1 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">Save sharing</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

type SectionTab = "overview" | "compliance" | "certificates" | "reports";

export default function SecurityPage() {
  const { user } = useAuth();
  const canView   = hasRole(user?.role, "Admin");
  const isDev     = hasRole(user?.role, "Developer");
  const [tab,       setTab]       = useState<SectionTab>("overview");
  const [catFilter, setCatFilter] = useState<SecurityCategory | "all">("all");
  const [shareReport, setShareReport] = useState<SecurityReport | null>(null);

  if (!canView && !isDev) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-5xl">🔒</p>
        <p className="text-lg font-semibold">Admin or Developer access required</p>
        <p className="text-sm text-muted-foreground">Security & Compliance is only visible to Admin and Owner roles.</p>
      </div>
    );
  }

  const TABS: { key: SectionTab; label: string }[] = [
    { key: "overview",     label: "Overview" },
    { key: "compliance",   label: "Compliance Controls" },
    { key: "certificates", label: "Certificates" },
    { key: "reports",      label: "Security Reports" },
  ];

  const filteredChecks = catFilter === "all"
    ? complianceChecks
    : complianceChecks.filter((c) => c.category === catFilter);

  // Summary stats
  const compliantCount    = complianceChecks.filter((c) => c.status === "compliant").length;
  const partialCount      = complianceChecks.filter((c) => c.status === "partial").length;
  const nonCompliantCount = complianceChecks.filter((c) => c.status === "non-compliant").length;
  const overallScore      = Math.round((compliantCount / complianceChecks.length) * 100);
  const expiringSoon      = certificates.filter((c) => c.status === "expiring-soon" || c.status === "expired").length;

  // Per-category score
  const categories: SecurityCategory[] = ["app", "ai", "hipaa", "data", "infra"];
  const categoryScore = (cat: SecurityCategory) => {
    const all  = complianceChecks.filter((c) => c.category === cat);
    const pass = all.filter((c) => c.status === "compliant").length;
    return all.length ? Math.round((pass / all.length) * 100) : 100;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            🛡️ Security & Compliance
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            App security, AI governance, HIPAA readiness, and certificate management
          </p>
        </div>
        {canView && (
          <button className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
            + Generate Report
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Top-line score + summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="col-span-2 md:col-span-1">
              <CardContent className="pt-4 pb-3 flex flex-col items-center gap-1">
                <ScoreGauge score={overallScore} />
                <p className="text-xs text-muted-foreground text-center">Overall Score</p>
              </CardContent>
            </Card>
            {[
              { label: "Compliant",     value: compliantCount,    color: "text-green-600" },
              { label: "Partial",       value: partialCount,      color: "text-yellow-600" },
              { label: "Non-Compliant", value: nonCompliantCount, color: "text-red-600" },
              { label: "Certs Expiring",value: expiringSoon,      color: "text-orange-600" },
            ].map(({ label, value, color }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-3">
                  <p className={cn("text-3xl font-bold", color)}>{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Per-category breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const score = categoryScore(cat);
              const checks = complianceChecks.filter((c) => c.category === cat);
              const issues = checks.filter((c) => c.status !== "compliant");
              return (
                <Card key={cat} className={cn(score < 70 && "border-red-200 dark:border-red-800")}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{CATEGORY_LABELS[cat]}</CardTitle>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", CATEGORY_COLOR[cat])}>
                        {score}%
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", score >= 85 ? "bg-green-500" : score >= 70 ? "bg-yellow-500" : "bg-red-500")}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    {issues.length > 0 ? (
                      <ul className="space-y-0.5">
                        {issues.map((i) => (
                          <li key={i.id} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className={i.status === "non-compliant" ? "text-red-500" : "text-yellow-500"}>⚠</span>
                            <span className="truncate">{i.control}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-green-600">✓ All controls passing</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* HIPAA awareness banner */}
          <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 px-4 py-3 text-xs text-green-800 dark:text-green-300 space-y-1">
            <p className="font-semibold text-sm">HIPAA Compliance Notice</p>
            <p>SmartDrugDiscovery processes de-identified research data only. PHI is never stored on platform servers. A Business Associate Agreement (BAA) is in place with Vercel and Anthropic. Data encryption at rest is planned for the upcoming Supabase/Prisma DB migration.</p>
          </div>
        </div>
      )}

      {/* ── COMPLIANCE CONTROLS ──────────────────────────────────────────── */}
      {tab === "compliance" && (
        <div className="space-y-4">
          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            {(["all", ...categories] as (SecurityCategory | "all")[]).map((cat) => (
              <button key={cat} onClick={() => setCatFilter(cat)}
                className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  catFilter === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80")}>
                {cat === "all" ? `All (${complianceChecks.length})` : `${CATEGORY_LABELS[cat]} (${complianceChecks.filter(c => c.category === cat).length})`}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredChecks.map((check) => (
              <Card key={check.id} className={cn(check.status === "non-compliant" && "border-red-200 dark:border-red-800")}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{check.id}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", CATEGORY_COLOR[check.category])}>
                          {CATEGORY_LABELS[check.category]}
                        </span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", STATUS_COLOR[check.status])}>
                          {STATUS_LABEL[check.status]}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{check.control}</p>
                      <p className="text-xs text-muted-foreground">{check.description}</p>
                      {check.remediation && (
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-start gap-1">
                          <span className="shrink-0">→</span>{check.remediation}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0 space-y-0.5">
                      <p className="text-[10px] text-muted-foreground">{check.assignedTo}</p>
                      <p className="text-[10px] text-muted-foreground">{check.lastChecked}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── CERTIFICATES ─────────────────────────────────────────────────── */}
      {tab === "certificates" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Active certificates, agreements, and compliance attestations. Click a row for details.
          </p>
          <div className="space-y-2">
            {certificates.map((cert) => (
              <Card key={cert.id} className={cn(cert.status === "expired" && "border-red-200 dark:border-red-800", cert.status === "expiring-soon" && "border-yellow-200 dark:border-yellow-800")}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", CATEGORY_COLOR[cert.category])}>
                          {CATEGORY_LABELS[cert.category]}
                        </span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", CERT_STATUS_COLOR[cert.status])}>
                          {cert.status === "expiring-soon" ? "⚠ Expiring Soon" : cert.status.charAt(0).toUpperCase() + cert.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{cert.name}</p>
                      <p className="text-xs text-muted-foreground">{cert.issuer} · Issued {cert.issuedDate}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium">Expires</p>
                      <p className={cn("text-sm font-semibold", cert.status === "expiring-soon" ? "text-yellow-600" : cert.status === "expired" ? "text-red-600" : "")}>
                        {cert.expiryDate}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── SECURITY REPORTS ─────────────────────────────────────────────── */}
      {tab === "reports" && (
        <div className="space-y-4">
          {!canView && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 px-4 py-3 text-xs text-yellow-800 dark:text-yellow-300">
              Security reports are visible to <strong>Admin and Owner</strong> roles only. You can see this section but cannot share or generate reports.
            </div>
          )}

          <div className="space-y-3">
            {securityReports.map((report) => (
              <Card key={report.id}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-start gap-4">
                    <ScoreGauge score={report.score} />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", CATEGORY_COLOR[report.category])}>
                              {CATEGORY_LABELS[report.category]}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{report.id}</span>
                          </div>
                          <p className="text-sm font-semibold">{report.title}</p>
                          <p className="text-xs text-muted-foreground">{report.generatedAt} · Generated by {report.generatedBy}</p>
                        </div>
                        {canView && (
                          <button
                            onClick={() => setShareReport(report)}
                            className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors shrink-0"
                          >
                            Share
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{report.summary}</p>
                      {/* Finding counts */}
                      <div className="flex gap-3 flex-wrap">
                        {report.critical > 0 && <span className="text-xs font-medium text-red-600">{report.critical} Critical</span>}
                        {report.high     > 0 && <span className="text-xs font-medium text-orange-600">{report.high} High</span>}
                        {report.medium   > 0 && <span className="text-xs font-medium text-yellow-600">{report.medium} Medium</span>}
                        {report.low      > 0 && <span className="text-xs font-medium text-blue-600">{report.low} Low</span>}
                        {report.findings === 0 && <span className="text-xs text-green-600">✓ No findings</span>}
                      </div>
                      {/* Shared with */}
                      {report.sharedWith.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">Shared with:</span>
                          {report.sharedWith.map((s, i) => (
                            <span key={i} className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                              {s.value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Share modal */}
      {shareReport && <ShareModal report={shareReport} onClose={() => setShareReport(null)} />}
    </div>
  );
}
