"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const { login, loginWithOrcid, inviteVerified } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!login(inviteCode)) {
      setError("Invalid invite code. Please check and try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <span className="text-primary-foreground text-2xl font-bold">SD</span>
          </div>
          <h1 className="text-3xl font-bold">SmartDrugDiscovery</h1>
          <p className="text-muted-foreground mt-1">AI Drug Discovery 2.0 Platform</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>{inviteVerified ? "Sign in with ORCID" : "Enter Invite Code"}</CardTitle>
            <CardDescription>
              {inviteVerified
                ? "Authenticate with your ORCID iD to access the platform"
                : "Enter your invitation code to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!inviteVerified ? (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium" htmlFor="invite-code">
                    Invite Code
                  </label>
                  <input
                    id="invite-code"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter your invite code"
                    className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                  {error && <p className="text-sm text-destructive mt-2">{error}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Verify Code
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={loginWithOrcid}
                  className="w-full flex items-center justify-center gap-3 rounded-md px-4 py-3 text-sm font-medium bg-[#A6CE39] text-white hover:bg-[#95ba33] transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0z" fill="#A6CE39"/>
                    <path d="M7.5 8.25a.938.938 0 110-1.875.938.938 0 010 1.875zM6.75 9.75h1.5v7.5h-1.5v-7.5zM10.5 9.75h2.625c2.906 0 4.125 1.969 4.125 3.75s-1.219 3.75-4.125 3.75H10.5v-7.5zm1.5 1.313v4.874h1.125c1.875 0 2.625-1.219 2.625-2.437 0-1.22-.75-2.438-2.625-2.438H12z" fill="white"/>
                  </svg>
                  Sign in with ORCID
                </button>
                <div className="text-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Use a different invite code
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          AIDD 2.0 — Multi-scale, Parallel, Evidence-driven Drug Discovery
        </p>
      </div>
    </div>
  );
}
