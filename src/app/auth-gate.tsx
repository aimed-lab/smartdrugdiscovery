"use client";

import { AuthProvider, useAuth } from "@/lib/auth-context";
import LoginPage from "./login/page";

export function AuthGate({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthSwitch>{children}</AuthSwitch>
    </AuthProvider>
  );
}

function AuthSwitch({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, logout } = useAuth();

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

function Sidebar({ user, onLogout }: { user: { name: string; orcid: string } | null; onLogout: () => void }) {
  return (
    <aside className="w-64 border-r bg-card p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 px-3 py-4 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-sm font-bold">SD</span>
        </div>
        <span className="font-semibold text-lg">SmartDrug</span>
      </div>

      <NavItem href="/" label="Dashboard" />
      <NavItem href="/projects" label="Projects" />
      <NavItem href="/disease" label="Disease" />
      <NavItem href="/targets" label="Targets" />
      <NavItem href="/drug" label="Drug" />
      <NavItem href="/models" label="Models" />
      <NavItem href="/business" label="Business" />
      <NavItem href="/design" label="Design with AI" />
      <NavItem href="/services" label="Add-on Service" />
      <NavItem href="/plugins" label="Tool Plugins" />

      <div className="mt-auto pt-4 border-t space-y-1">
        {user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
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

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {label}
    </a>
  );
}
