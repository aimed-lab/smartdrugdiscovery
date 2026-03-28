"use client";

import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import LoginPage from "./login/page";
import { cn } from "@/lib/utils";
import {
  Dna, FlaskConical, Stethoscope, ShieldCheck,
  Sparkles, Package, Puzzle, FolderOpen, BrainCircuit, Headset, Lock, ShieldAlert,
} from "lucide-react";
import { FeedbackWidget } from "@/components/feedback-widget";
import { RoleAvatar } from "@/components/role-avatar";
import { PLATFORM_CONFIG } from "@/lib/platform-config";
import { type AppRole, hasRole } from "@/lib/roles";
import {
  type ModuleKey, loadModuleAccess, getAccess, type ModuleAccessConfig,
} from "@/lib/module-access";

export function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthSwitch>{children}</AuthSwitch>
    </AuthProvider>
  );
}

function AuthSwitch({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return <div className="flex h-screen items-center justify-center" />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        onLogout={logout}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <FeedbackWidget user={user} />
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">SD</span>
            </div>
            <span className="font-bold text-sm">SmartDrugDiscovery</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { href: string; label: string }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Projects",
    icon: FolderOpen,
    items: [
      { href: "/projects", label: "Directory" },
      { href: "/projects/team", label: "Team" },
      { href: "/projects/performance", label: "Performance" },
      { href: "/projects/reports", label: "Reports" },
    ],
  },
  {
    label: "Biology",
    icon: Dna,
    items: [
      { href: "/disease-biology/target-board", label: "Target Board" },
      { href: "/disease-biology/mechanisms", label: "Mechanisms of Action" },
      { href: "/disease-biology/perturbation", label: "Perturbation Simulations" },
      { href: "/disease-biology/decisions", label: "Decision Reports" },
    ],
  },
  {
    label: "Pharmacology",
    icon: FlaskConical,
    items: [
      { href: "/pharmacology/candidates", label: "Candidate Molecules" },
      { href: "/pharmacology/optimization", label: "Engineering Optimization" },
      { href: "/pharmacology/simulations", label: "Model Simulations" },
      { href: "/pharmacology/decisions", label: "Decision Reports" },
    ],
  },
  {
    label: "Clinical",
    icon: Stethoscope,
    items: [
      { href: "/clinical/cohorts", label: "Candidate Cohorts" },
      { href: "/clinical/biomarkers", label: "Companion Biomarker Opt." },
      { href: "/clinical/trials", label: "Trial Simulations" },
      { href: "/clinical/decisions", label: "Decision Reports" },
    ],
  },
  {
    label: "Regulation",
    icon: ShieldCheck,
    items: [
      { href: "/regulatory/irb", label: "IRB Protocols" },
      { href: "/regulatory/clinical-docs", label: "Clinical Trial Documents" },
      { href: "/regulatory/licensing", label: "Copyright / OSDD2 License" },
      { href: "/regulatory/business", label: "Business Optimization" },
      { href: "/regulatory/transactions", label: "Transaction Simulations" },
      { href: "/regulatory/decisions", label: "Decision Reports" },
    ],
  },
];

function Sidebar({
  user,
  onLogout,
  mobileOpen,
  onClose,
}: {
  user: { name: string; email: string; avatar: string; title?: string; role: AppRole; avatarType?: "initials" | "emoji" | "photo"; avatarPhoto?: string } | null;
  onLogout: () => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "Projects": true,
    "Biology": false,
    "Pharmacology": false,
    "Clinical": false,
    "Regulation": false,
  });
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState<0 | 1 | 2>(0);
  const [moduleAccess, setModuleAccess] = useState<ModuleAccessConfig>({});

  // Load module access config from localStorage (admin-configurable)
  useEffect(() => { setModuleAccess(loadModuleAccess()); }, []);

  /** Returns "full" | "partial" | "hidden" for the current user + a module key. */
  const access = (key: ModuleKey) => getAccess(moduleAccess, user?.role, key);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const setSize = (level: 0 | 1 | 2) => {
    setFontSize(level);
    const sizes = ["100%", "115%", "130%"];
    document.documentElement.style.fontSize = sizes[level];
  };

  const toggle = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 border-r bg-card flex flex-col overflow-y-auto transition-transform duration-200",
        "md:relative md:translate-x-0 md:z-auto md:transition-none",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo & Tagline */}
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">SD</span>
          </div>
          <div>
            <span className="font-bold text-base leading-tight block">SmartDrugDiscovery</span>
            <span className="text-[10px] text-muted-foreground tracking-wide uppercase whitespace-nowrap">AIDD 2.0 · OSDD2</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {/* Grouped sections */}
        {navGroups.map((group) => {
          const GroupIcon = group.icon;
          // Map group label to module key
          const groupKey = group.label.toLowerCase() as ModuleKey;
          const groupAccess = access(groupKey);
          if (groupAccess === "hidden") return null;

          return (
            <div key={group.label} className="mt-1">
              <button
                onClick={() => toggle(group.label)}
                className={cn(
                  "flex items-center justify-between w-full rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                  groupAccess === "partial"
                    ? "text-muted-foreground/60 hover:bg-accent/30 cursor-not-allowed"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <span className="flex items-center gap-2">
                  <GroupIcon className="h-3.5 w-3.5 shrink-0" />
                  {group.label}
                  {groupAccess === "partial" && <Lock className="h-3 w-3 shrink-0 opacity-50" />}
                </span>
                <svg
                  className={cn("h-3.5 w-3.5 transition-transform shrink-0", expanded[group.label] && "rotate-90")}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
              {expanded[group.label] && (
                <div className="ml-2 border-l border-border pl-1 space-y-0.5 mt-0.5">
                  {group.items.map((item) => {
                    // Build sub-key: e.g. "biology/target-board" from href "/disease-biology/target-board"
                    const hrefParts  = item.href.replace("/disease-biology", "/biology").split("/").filter(Boolean);
                    const subKey = hrefParts.length >= 2
                      ? (`${groupKey}/${hrefParts[hrefParts.length - 1]}` as ModuleKey)
                      : groupKey;
                    const subAccess = access(subKey);
                    if (subAccess === "hidden") return null;
                    return (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        sub
                        onNavigate={onClose}
                        locked={subAccess === "partial"}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Utilities */}
        <div className="mt-3 pt-2 border-t space-y-0.5">
          {access("design")  !== "hidden" && <NavItem href="/design"   label="Design with AI"     icon={Sparkles}     onNavigate={onClose} locked={access("design")  === "partial"} />}
          {access("models")  !== "hidden" && <NavItem href="/models"   label="Foundation Models"  icon={BrainCircuit} onNavigate={onClose} locked={access("models")  === "partial"} />}
          {access("services")!== "hidden" && <NavItem href="/services" label="Add-on Service"     icon={Package}      onNavigate={onClose} locked={access("services")=== "partial"} />}
          {access("plugins") !== "hidden" && <NavItem href="/plugins"  label="Tool Plugins"       icon={Puzzle}       onNavigate={onClose} locked={access("plugins") === "partial"} />}
          {access("support") !== "hidden" && (
            <NavItem href="/support" label="Support" icon={Headset} onNavigate={onClose} locked={access("support") === "partial"} />
          )}
          {hasRole(user?.role, "Developer") && (
            <NavItem href="/security" label="Security & Compliance" icon={ShieldAlert} onNavigate={onClose} />
          )}
        </div>
      </div>

      {/* Footer — Claude-style */}
      <div className="border-t">
        {/* Quick actions row */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-1">
            <a href="/admin" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors" title="Admin Dashboard">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </a>
            <a href="/settings" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors" title="Settings">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </a>
            {/* Font size buttons */}
            {([0, 1, 2] as const).map((level) => (
              <button
                key={level}
                onClick={() => setSize(level)}
                title={["Normal text", "Large text", "Largest text"][level]}
                className={cn(
                  "rounded-md px-1 py-1 transition-colors font-bold leading-none",
                  fontSize === level
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                style={{ fontSize: ["10px", "12px", "15px"][level] }}
              >
                A
              </button>
            ))}
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
        </div>

        {/* User profile row */}
        {user && (
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              {/* Avatar — role color synced via RoleAvatar; click → Settings */}
              <RoleAvatar
                user={user}
                size="sm"
                href="/settings"
                onClick={onClose}
                title={`Role: ${user.role} — click to manage`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.title || user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="rounded-md p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                title="Sign out"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Version */}
      <div className="px-4 py-1.5 border-t">
        <p className="text-[10px] text-muted-foreground/40 text-right select-none">v{PLATFORM_CONFIG.version}</p>
      </div>
    </aside>
  );
}

function NavItem({ href, label, sub, icon: Icon, onNavigate, locked }: {
  href: string;
  label: string;
  sub?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  onNavigate?: () => void;
  /** Partial access — shown with a lock icon, click navigates but page shows restricted notice */
  locked?: boolean;
}) {
  return (
    <a
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors",
        sub ? "text-xs ml-1" : "text-sm",
        locked
          ? "text-muted-foreground/50 hover:bg-accent/30 italic"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
      title={locked ? "Partial access — contact your Admin for full access" : undefined}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span className="flex-1">{label}</span>
      {locked && <Lock className="h-3 w-3 shrink-0 opacity-40" />}
    </a>
  );
}
