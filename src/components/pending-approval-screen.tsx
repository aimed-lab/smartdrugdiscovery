"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth, type AccountStatus } from "@/lib/auth-context";
import { Clock, XCircle, ShieldOff, RefreshCw, LogOut, Mail, UserCheck, Loader2 } from "lucide-react";

export function AccountStatusGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.accountStatus) {
    case "pending_approval":
    case "invited":
      return <PendingApprovalScreen />;
    case "rejected":
      return <RejectedScreen />;
    case "suspended":
      return <SuspendedScreen />;
    case "active":
    default:
      return <>{children}</>;
  }
}

/** Auto-polls server every 15s so users see approval without manual refresh. */
function PendingApprovalScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-poll server every 15 seconds
  useEffect(() => {
    const poll = () => {
      refreshUser();
      setLastChecked(new Date().toLocaleTimeString());
    };
    // Initial check on mount
    poll();
    intervalRef.current = setInterval(poll, 15_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshUser]);

  const handleManualCheck = () => {
    setChecking(true);
    refreshUser();
    setLastChecked(new Date().toLocaleTimeString());
    // Show spinner briefly so user sees feedback
    setTimeout(() => setChecking(false), 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-center">Awaiting Approval</h1>
          <p className="text-muted-foreground mt-1 text-sm text-center">
            Your account is pending administrator review
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            {user?.invitedBy && (
              <div className="flex items-center gap-3">
                <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Invited by</p>
                  <p className="font-medium">{user.invitedBy}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <ShieldOff className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Assigned role</p>
                <p className="font-medium capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              An administrator will review your request shortly. You&apos;ll get
              full access once approved. This page checks automatically.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleManualCheck}
              disabled={checking}
              className="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-colors"
            >
              {checking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {checking ? "Checking..." : "Check Status"}
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>

          {lastChecked && (
            <p className="text-xs text-muted-foreground text-center">
              Last checked: {lastChecked}
            </p>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          SmartDrugDiscovery &middot; AIDD 2.0 &middot; OSDD2
        </p>
      </div>
    </div>
  );
}

function RejectedScreen() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-center">Access Not Approved</h1>
          <p className="text-muted-foreground mt-1 text-sm text-center">
            Your request to join the platform was not approved
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
            <p className="text-xs text-red-800 dark:text-red-300">
              Contact your team administrator if you believe this was an error
              or to request reconsideration.
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function SuspendedScreen() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-slate-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md px-4">
        <div className="flex flex-col items-center mb-6">
          <div className="h-16 w-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <ShieldOff className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-center">Account Suspended</h1>
          <p className="text-muted-foreground mt-1 text-sm text-center">
            Your account has been temporarily suspended
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Contact your team administrator for more information about your
              account status.
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
