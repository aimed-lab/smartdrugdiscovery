"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { importInvitationFromParams } from "@/lib/invitations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmailInvite, setIsEmailInvite] = useState(false);

  // Pre-fill invite code from URL ?invite=TOKEN and import invitation data
  let searchParams: ReturnType<typeof useSearchParams> | null = null;
  try { searchParams = useSearchParams(); } catch { /* noop — rendered outside Suspense */ }
  useEffect(() => {
    if (!searchParams) return;
    const token = searchParams.get("invite");
    if (token) {
      setInviteCode(token);
      // If this is an email invitation, hide the code field entirely
      if (searchParams.get("type") === "email") {
        setIsEmailInvite(true);
      }
      // Import the invitation payload from URL params into this browser's localStorage
      // so validateToken() can find it (invitations are per-browser in localStorage)
      importInvitationFromParams(searchParams);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const err = await login(email, inviteCode);
      if (err) setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <span className="text-primary-foreground text-2xl font-bold">SD</span>
          </div>
          <h1 className="text-3xl font-bold">SmartDrugDiscovery</h1>
          <p className="text-muted-foreground mt-1 text-sm uppercase tracking-widest">faster &middot; cheaper &middot; personalized</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{isEmailInvite ? "Accept Invitation" : "Sign In"}</CardTitle>
            <CardDescription>
              {isEmailInvite
                ? "You\u2019ve been invited to join the platform. Enter your email to confirm."
                : "Enter your email to access the platform. New users need an invitation code."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@institution.edu"
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
              {!isEmailInvite && (
                <div>
                  <label className="text-sm font-medium" htmlFor="invite-code">
                    Invitation Code
                  </label>
                  <input
                    id="invite-code"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="e.g. ABCD1234"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Returning users can sign in without a code.
                    Need an invitation? Ask a team member for an invite link.
                  </p>
                </div>
              )}
              {isEmailInvite && (
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    This is a direct invitation — no code needed. Just confirm your email above and click the button below.
                  </p>
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-colors"
              >
                {loading ? "Signing in..." : isEmailInvite ? "Accept & Join" : "Sign In"}
              </button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          AIDD 2.0 — Multi-scale, Parallel, Evidence-driven Drug Discovery
        </p>
      </div>
    </div>
  );
}
