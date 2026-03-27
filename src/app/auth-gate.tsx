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

function Sidebar({ user, onLogout }: { user: { name: string; email: string } | null; onLogout: () => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "Disease Biology": true,
    "Pharmacology": false,
    "Clinical Development": false,
    "Regulatory Compliance": false,
  });

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

      {/* Footer */}
      <div className="px-3 py-3 border-t space-y-1">
        {user && (
          <div className="px-3 py-1.5">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <NavItem href="/admin" label="Admin Dashboard" />
        <NavItem href="/settings" label="Settings" />
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          Sign Out
        </button>
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
