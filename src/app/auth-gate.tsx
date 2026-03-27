"use client";

import { useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import LoginPage from "./login/page";
import { cn } from "@/lib/utils";

export function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthSwitch>{children}</AuthSwitch>
    </AuthProvider>
  );
}

function AuthSwitch({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user, logout } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center" />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

interface NavGroup {
  label: string;
  items: { href: string; label: string }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Disease Biology",
    items: [
      { href: "/disease-biology/target-board", label: "Target Board" },
      { href: "/disease-biology/mechanisms", label: "Mechanisms of Action" },
      { href: "/disease-biology/perturbation", label: "Perturbation Simulations" },
      { href: "/disease-biology/decisions", label: "Decision Reports" },
    ],
  },
  {
    label: "Pharmacology",
    items: [
      { href: "/pharmacology/candidates", label: "Candidate Molecules" },
      { href: "/pharmacology/optimization", label: "Engineering Optimization" },
      { href: "/pharmacology/simulations", label: "Model Simulations" },
      { href: "/pharmacology/decisions", label: "Decision Reports" },
    ],
  },
  {
    label: "Clinical Development",
    items: [
      { href: "/clinical/cohorts", label: "Candidate Cohorts" },
      { href: "/clinical/biomarkers", label: "Companion Biomarker Opt." },
      { href: "/clinical/trials", label: "Trial Simulations" },
      { href: "/clinical/decisions", label: "Decision Reports" },
    ],
  },
  {
    label: "Regulatory Compliance",
    items: [
      { href: "/regulatory/licensing", label: "Copyright / OSDD2 License" },
      { href: "/regulatory/business", label: "Business Optimization" },
      { href: "/regulatory/transactions", label: "Transaction Simulations" },
      { href: "/regulatory/decisions", label: "Decision Reports" },
    ],
  },
];

function Sidebar({ user, onLogout }: { user: { name: string; email: string; avatar: string; title?: string } | null; onLogout: () => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "Disease Biology": true,
    "Pharmacology": false,
    "Clinical Development": false,
    "Regulatory Compliance": false,
  });
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const toggle = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <aside className="w-64 border-r bg-card flex flex-col overflow-y-auto">
      {/* Logo & Tagline */}
      <div className="px-4 py-5 border-b">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">SD</span>
          </div>
          <div>
            <span className="font-bold text-base leading-tight block">SmartDrugDiscovery</span>
            <span className="text-[10px] text-muted-foreground tracking-wide uppercase">faster · cheaper · personalized</span>
          </div>
        </div>
      </div>

      <div className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {/* Projects */}
        <NavItem href="/projects" label="Projects" />

        {/* Grouped sections */}
        {navGroups.map((group) => (
          <div key={group.label} className="mt-1">
            <button
              onClick={() => toggle(group.label)}
              className="flex items-center justify-between w-full rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              {group.label}
              <svg
                className={cn("h-3.5 w-3.5 transition-transform", expanded[group.label] && "rotate-90")}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            {expanded[group.label] && (
              <div className="ml-2 border-l border-border pl-1 space-y-0.5 mt-0.5">
                {group.items.map((item) => (
                  <NavItem key={item.href} href={item.href} label={item.label} sub />
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Utilities */}
        <div className="mt-3 pt-2 border-t space-y-0.5">
          <NavItem href="/design" label="Design with AI" />
          <NavItem href="/services" label="Add-on Service" />
          <NavItem href="/plugins" label="Tool Plugins" />
        </div>
      </div>

      {/* Footer — Claude-style */}
      <div className="border-t">
        {/* Quick actions row */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-1">
            <a href="/admin" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors" title="Admin Dashboard">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </a>
            <a href="/settings" className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors" title="Settings">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </a>
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
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
              {user.avatar}
            </div>
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
        )}
      </div>
    </aside>
  );
}

function NavItem({ href, label, sub }: { href: string; label: string; sub?: boolean }) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors",
        sub ? "text-xs ml-1" : "text-sm"
      )}
    >
      {label}
    </a>
  );
}
