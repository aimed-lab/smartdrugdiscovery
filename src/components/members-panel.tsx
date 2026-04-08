"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, type User, type AccountStatus } from "@/lib/auth-context";
import {
  type AppRole, ROLE_ORDER, ROLE_META, roleRank, hasRole,
} from "@/lib/roles";
import {
  type Invitation,
  createInvitation, getAllInvitations, getInvitationsByUser,
  revokeInvitation, getRemainingQuota, buildInviteLink,
  INVITE_QUOTAS, getPlatformSettings, savePlatformSettings,
  DEFAULT_MAX_ACTIVE_USERS,
} from "@/lib/invitations";
import {
  UserCheck, UserX, Clock, Copy, Check, Link2, Plus,
  Shield, Users, Mail, Trash2, RefreshCw, AlertTriangle,
  ChevronDown, Settings2, MoreHorizontal, Ban, ShieldOff,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function expiresIn(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "expired";
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function RoleBadge({ role }: { role: AppRole }) {
  const meta = ROLE_META[role];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function StatusBadge({ status }: { status: AccountStatus }) {
  const styles: Record<AccountStatus, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    invited: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    suspended: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };
  const labels: Record<AccountStatus, string> = {
    active: "Active",
    pending_approval: "Pending Approval",
    invited: "Invited",
    rejected: "Rejected",
    suspended: "Suspended",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────

export function MembersPanel() {
  const { user, getAllUsers, approveUser, rejectUser, suspendUser, reactivateUser, updateUserRole } = useAuth();
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error" | "ok">("idle");

  const refresh = useCallback(() => {
    // Start with localStorage users
    const localUsers = getAllUsers();
    setAllUsers(localUsers);
    setSyncStatus("syncing");

    // Also fetch from server-side registry and merge
    fetch("/api/users")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { users?: { email: string; name: string; role: string; accountStatus: string; invitedBy?: string; invitedAt?: string; approvedBy?: string; approvedAt?: string }[] }) => {
        if (!data.users?.length) {
          setSyncStatus("ok");
          return;
        }
        const merged = { ...localUsers };
        for (const su of data.users) {
          const email = su.email.toLowerCase();
          if (!merged[email]) {
            // Server-only user — not in admin's localStorage
            merged[email] = {
              name: su.name || su.email.split("@")[0],
              email,
              avatar: (su.name || su.email).split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase(),
              title: "",
              role: (su.role || "User") as import("@/lib/roles").AppRole,
              institution: "",
              accountStatus: (su.accountStatus || "active") as import("@/lib/auth-context").AccountStatus,
              invitedBy: su.invitedBy,
              invitedAt: su.invitedAt,
              approvedBy: su.approvedBy,
              approvedAt: su.approvedAt,
            };
          } else {
            // Server is authoritative — merge status, role, approval info
            const serverStatus = su.accountStatus as import("@/lib/auth-context").AccountStatus;
            const serverRole = su.role as import("@/lib/roles").AppRole;
            merged[email] = {
              ...merged[email],
              ...(su.accountStatus ? { accountStatus: serverStatus } : {}),
              ...(su.role ? { role: serverRole } : {}),
              ...(su.approvedBy ? { approvedBy: su.approvedBy } : {}),
              ...(su.approvedAt ? { approvedAt: su.approvedAt } : {}),
              ...(su.invitedBy ? { invitedBy: su.invitedBy } : {}),
            };
          }
        }
        setAllUsers(merged);
        setSyncStatus("ok");
      })
      .catch((err) => {
        console.warn("[SDD] Failed to fetch server user registry:", err);
        setSyncStatus("error");
      });

    // Load invitations from localStorage first
    if (user && hasRole(user.role, "Admin")) {
      setInvitations(getAllInvitations());
    } else if (user) {
      setInvitations(getInvitationsByUser(user.email));
    }

    // Also fetch invitations from server and merge
    if (user) {
      const scope = hasRole(user.role, "Admin") ? "all" : "";
      const url = scope
        ? "/api/invitations?scope=all"
        : `/api/invitations?email=${encodeURIComponent(user.email)}`;
      fetch(url)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (!data?.invitations?.length) return;
          // Merge server invitations with local ones (server is authoritative)
          const localInvs = hasRole(user.role, "Admin") ? getAllInvitations() : getInvitationsByUser(user.email);
          const localById = new Map(localInvs.map((i: Invitation) => [i.id, i]));
          const merged: Invitation[] = [...localInvs];
          for (const si of data.invitations) {
            if (!localById.has(si.id)) {
              // Server-only invitation — add it
              merged.push({
                id: si.id,
                token: si.token,
                createdBy: si.created_by ?? si.createdBy,
                assignedRole: si.assigned_role ?? si.assignedRole,
                recipientHint: si.recipient_hint ?? si.recipientHint,
                autoApprove: si.auto_approve ?? si.autoApprove ?? false,
                status: si.status,
                acceptedBy: si.accepted_by ?? si.acceptedBy ?? null,
                createdAt: si.created_at ?? si.createdAt,
                expiresAt: si.expires_at ?? si.expiresAt,
                acceptedAt: si.accepted_at ?? si.acceptedAt ?? null,
              });
            } else {
              // Update status from server if different
              const local = localById.get(si.id)!;
              const serverStatus = si.status;
              if (serverStatus !== local.status) {
                const idx = merged.findIndex((m: Invitation) => m.id === si.id);
                if (idx >= 0) merged[idx] = { ...merged[idx], status: serverStatus };
              }
            }
          }
          setInvitations(merged);
        })
        .catch(() => { /* server invitations unavailable, local data still shown */ });
    }
  }, [getAllUsers, user]);

  useEffect(() => { refresh(); }, [refresh, refreshKey]);

  const isAdmin = user && hasRole(user.role, "Admin");

  const pendingUsers  = Object.values(allUsers).filter(u => u.accountStatus === "pending_approval");
  const activeUsers   = Object.values(allUsers).filter(u => u.accountStatus === "active");
  const invitedUsers  = Object.values(allUsers).filter(u => u.accountStatus === "invited");
  const inactiveUsers = Object.values(allUsers).filter(u =>
    u.accountStatus === "rejected" || u.accountStatus === "suspended"
  );

  return (
    <div className="space-y-6">
      {/* ── Approval Queue ──────────────────────────────────────────── */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base">Approval Queue</CardTitle>
                {pendingUsers.length > 0 && (
                  <span className="inline-flex items-center justify-center h-5 min-w-5 rounded-full bg-amber-500 text-white text-xs font-bold px-1.5">
                    {pendingUsers.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {syncStatus === "syncing" && (
                  <span className="text-xs text-muted-foreground animate-pulse">Syncing...</span>
                )}
                {syncStatus === "error" && (
                  <span className="text-xs text-amber-600 dark:text-amber-400" title="Server sync failed — showing local data only">
                    <AlertTriangle className="h-3.5 w-3.5 inline" /> Offline
                  </span>
                )}
                {syncStatus === "ok" && (
                  <span className="text-xs text-green-600 dark:text-green-400">Synced</span>
                )}
                <button
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                  title="Refresh from server"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncStatus === "syncing" ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
            <CardDescription>New users awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No pending approvals</p>
            ) : (
              <div className="space-y-2">
                {pendingUsers.map(u => (
                  <ApprovalRow
                    key={u.email}
                    member={u}
                    adminRole={user!.role}
                    onApprove={(role) => {
                      if (role !== u.role) updateUserRole(u.email, role);
                      approveUser(u.email);
                      setRefreshKey(k => k + 1);
                    }}
                    onReject={() => { rejectUser(u.email); setRefreshKey(k => k + 1); }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Invited (not yet signed up) ────────────────────────────── */}
      {invitedUsers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-base">Invited</CardTitle>
              <span className="text-xs text-muted-foreground">({invitedUsers.length})</span>
            </div>
            <CardDescription>Users who have been invited but haven&apos;t signed up yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitedUsers.map(u => (
                <div key={u.email} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{u.name || u.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <RoleBadge role={u.role} />
                      <StatusBadge status="invited" />
                      {u.invitedBy && (
                        <span className="text-xs text-muted-foreground">invited by {u.invitedBy}</span>
                      )}
                      {u.invitedAt && (
                        <span className="text-xs text-muted-foreground">{timeAgo(u.invitedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Active Members ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-500" />
            <CardTitle className="text-base">Active Members</CardTitle>
            <span className="text-xs text-muted-foreground">({activeUsers.length})</span>
          </div>
          <CardDescription>Users with platform access</CardDescription>
        </CardHeader>
        <CardContent>
          {activeUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No active members</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">Name</th>
                    <th className="pb-2 pr-4">Email</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2 pr-4">Invited By</th>
                    <th className="pb-2 pr-4">Joined</th>
                    {isAdmin && <th className="pb-2">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activeUsers.map(u => (
                    <tr key={u.email}>
                      <td className="py-2 pr-4 font-medium">{u.name}</td>
                      <td className="py-2 pr-4 text-muted-foreground text-xs">{u.email}</td>
                      <td className="py-2 pr-4">
                        {isAdmin && u.email !== user?.email && u.role !== "Owner" ? (
                          <RoleSelector
                            currentRole={u.role}
                            maxRole={user!.role}
                            onChange={(newRole) => { updateUserRole(u.email, newRole); setRefreshKey(k => k + 1); }}
                          />
                        ) : (
                          <RoleBadge role={u.role} />
                        )}
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">{u.invitedBy || "—"}</td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">
                        {u.approvedAt ? timeAgo(u.approvedAt) : u.invitedAt ? timeAgo(u.invitedAt) : "—"}
                      </td>
                      {isAdmin && (
                        <td className="py-2">
                          {u.email !== user?.email && u.role !== "Owner" && (
                            <ActionsMenu
                              onSuspend={() => { suspendUser(u.email); setRefreshKey(k => k + 1); }}
                              onRevoke={() => { rejectUser(u.email); setRefreshKey(k => k + 1); }}
                            />
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Inactive / Suspended / Rejected ─────────────────────────── */}
      {isAdmin && inactiveUsers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Inactive Users</CardTitle>
              <span className="text-xs text-muted-foreground">({inactiveUsers.length})</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inactiveUsers.map(u => (
                <div key={u.email} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <RoleBadge role={u.role} />
                      <StatusBadge status={u.accountStatus ?? "active"} />
                    </div>
                  </div>
                  <button
                    onClick={() => { reactivateUser(u.email); setRefreshKey(k => k + 1); }}
                    className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium border border-input bg-background hover:bg-accent transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reactivate
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Invitations ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-base">Invitations</CardTitle>
          </div>
          <CardDescription>
            {isAdmin ? "All invitations across the platform" : "Your sent invitations"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create new invitation */}
          <CreateInvitationForm onCreated={() => setRefreshKey(k => k + 1)} />

          {/* Invitation list */}
          {invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2 text-center">No invitations yet</p>
          ) : (
            <div className="space-y-2">
              {[...invitations].reverse().map(inv => (
                <InvitationRow
                  key={inv.id}
                  invitation={inv}
                  isAdmin={!!isAdmin}
                  onRevoke={() => { revokeInvitation(inv.id); setRefreshKey(k => k + 1); }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Platform Capacity (Owner only) ──────────────────────────── */}
      {user?.role === "Owner" && (
        <PlatformCapacityCard activeCount={activeUsers.length} />
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function ApprovalRow({ member, adminRole, onApprove, onReject }: {
  member: User;
  adminRole: AppRole;
  onApprove: (role: AppRole) => void;
  onReject: () => void;
}) {
  const [selectedRole, setSelectedRole] = useState<AppRole>(member.role);
  const maxIdx = ROLE_ORDER.indexOf(adminRole);
  const assignableRoles = ROLE_ORDER.filter((_, i) => i >= maxIdx);

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{member.name}</p>
        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Role:</span>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value as AppRole)}
              className="rounded-md border border-input bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {assignableRoles.map(r => (
                <option key={r} value={r}>{ROLE_META[r].label}</option>
              ))}
            </select>
          </div>
          {member.invitedBy && (
            <span className="text-xs text-muted-foreground">
              invited by {member.invitedBy}
            </span>
          )}
          {member.invitedAt && (
            <span className="text-xs text-muted-foreground">
              {timeAgo(member.invitedAt)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onApprove(selectedRole)}
          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          <UserCheck className="h-3.5 w-3.5" />
          Approve
        </button>
        <button
          onClick={onReject}
          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          <UserX className="h-3.5 w-3.5" />
          Reject
        </button>
      </div>
    </div>
  );
}

function ActionsMenu({ onSuspend, onRevoke }: {
  onSuspend: () => void;
  onRevoke: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        title="Actions"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-md border bg-card shadow-lg py-1">
            <button
              onClick={() => { setOpen(false); onSuspend(); }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left hover:bg-accent transition-colors"
            >
              <Ban className="h-3.5 w-3.5 text-amber-500" />
              Suspend Account
            </button>
            <button
              onClick={() => { setOpen(false); onRevoke(); }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-left text-destructive hover:bg-destructive/10 transition-colors"
            >
              <ShieldOff className="h-3.5 w-3.5" />
              Revoke Access
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function RoleSelector({ currentRole, maxRole, onChange }: {
  currentRole: AppRole;
  maxRole: AppRole;
  onChange: (role: AppRole) => void;
}) {
  const maxIdx = ROLE_ORDER.indexOf(maxRole);
  // Can only assign roles at or below your own rank (higher index = lower rank)
  const options = ROLE_ORDER.filter((_, i) => i >= maxIdx && ROLE_ORDER[i] !== "Owner");

  return (
    <select
      value={currentRole}
      onChange={e => onChange(e.target.value as AppRole)}
      className="rounded-md border border-input bg-background px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {options.map(role => (
        <option key={role} value={role}>{ROLE_META[role].label}</option>
      ))}
    </select>
  );
}

function CreateInvitationForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole>("User");
  const [recipientHint, setRecipientHint] = useState("");
  const [autoApprove, setAutoApprove] = useState(false);
  const [result, setResult] = useState<{ token: string; link: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const maxIdx = ROLE_ORDER.indexOf(user.role);
  const assignableRoles = ROLE_ORDER.filter((_, i) => i >= maxIdx);
  const canAutoApprove = hasRole(user.role, "Admin");
  const remaining = getRemainingQuota(user.email, user.role);

  function handleCreate() {
    setError("");
    setResult(null);
    const hint = recipientHint.trim();
    const inv = createInvitation(user!.email, user!.role, role, hint || undefined, autoApprove);
    if ("error" in inv) {
      setError(inv.error);
      return;
    }
    const link = buildInviteLink(inv.token);
    setResult({ token: inv.token, link });

    // If recipient looks like an email, create a placeholder "invited" user
    // so they show up in the Members list immediately
    if (hint && hint.includes("@")) {
      const email = hint.toLowerCase();
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: hint.split("@")[0].replace(/[._-]/g, " "),
          role,
          accountStatus: "invited",
          invitedBy: user!.email,
          invitedAt: new Date().toISOString(),
        }),
      }).catch(() => {});
    }

    setRecipientHint("");
    onCreated();
  }

  function copyLink() {
    if (!result) return;
    navigator.clipboard.writeText(result.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Plus className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Create Invitation</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {remaining} / {INVITE_QUOTAS[user.role]} remaining
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Assign Role</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value as AppRole)}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {assignableRoles.map(r => (
              <option key={r} value={r}>{ROLE_META[r].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Recipient Email (recommended)</label>
          <input
            type="text"
            value={recipientHint}
            onChange={e => setRecipientHint(e.target.value)}
            placeholder="user@institution.edu"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {canAutoApprove && (
        <label className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            checked={autoApprove}
            onChange={e => setAutoApprove(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span>Auto-approve (skip approval queue)</span>
        </label>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleCreate}
          disabled={remaining <= 0}
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Link2 className="h-3.5 w-3.5" />
          Generate Invite Link
        </button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {result && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800 dark:text-green-300">Invitation created!</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white dark:bg-gray-900 rounded px-2 py-1 border truncate">
              {result.link}
            </code>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border border-input bg-background hover:bg-accent transition-colors shrink-0"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Token: <span className="font-mono font-bold">{result.token}</span> &middot; Expires in 14 days
          </p>
        </div>
      )}
    </div>
  );
}

function InvitationRow({ invitation, isAdmin, onRevoke }: {
  invitation: Invitation;
  isAdmin: boolean;
  onRevoke: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const inv = invitation;

  const statusStyles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    accepted: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    revoked: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    expired: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  };

  function copyLink() {
    navigator.clipboard.writeText(buildInviteLink(inv.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs tracking-wider">
            {inv.token.slice(0, 4)}****
          </span>
          <RoleBadge role={inv.assignedRole} />
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[inv.status]}`}>
            {inv.status}
          </span>
          {inv.autoApprove && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              auto-approve
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          {inv.recipientHint && <span>for: {inv.recipientHint}</span>}
          {isAdmin && <span>by: {inv.createdBy}</span>}
          {inv.status === "pending" && <span>expires {expiresIn(inv.expiresAt)}</span>}
          {inv.status === "accepted" && inv.acceptedBy && <span>used by: {inv.acceptedBy}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {inv.status === "pending" && (
          <>
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs border border-input bg-background hover:bg-accent transition-colors"
              title="Copy invite link"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
            <button
              onClick={onRevoke}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-destructive border border-input bg-background hover:bg-destructive/10 transition-colors"
              title="Revoke invitation"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PlatformCapacityCard({ activeCount }: { activeCount: number }) {
  const [settings, setSettings] = useState(getPlatformSettings());
  const [saved, setSaved] = useState(false);

  // Load from server on mount
  useEffect(() => {
    fetch("/api/settings?key=maxActiveUsers")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.value) {
          const serverMax = Number(data.value);
          if (serverMax > 0) setSettings({ maxActiveUsers: serverMax });
        }
      })
      .catch(() => {});
  }, []);

  function handleSave() {
    savePlatformSettings(settings);
    // Also save to server
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "maxActiveUsers", value: String(settings.maxActiveUsers) }),
    }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const pct = settings.maxActiveUsers > 0
    ? Math.round((activeCount / settings.maxActiveUsers) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-purple-500" />
          <CardTitle className="text-base">Platform Capacity</CardTitle>
        </div>
        <CardDescription>Control the maximum number of active users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>{activeCount} active users</span>
              <span className="text-muted-foreground">/ {settings.maxActiveUsers} max</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-green-500"
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Max active users:</label>
          <input
            type="number"
            min={1}
            max={10000}
            value={settings.maxActiveUsers}
            onChange={e => setSettings({ ...settings, maxActiveUsers: Number(e.target.value) || DEFAULT_MAX_ACTIVE_USERS })}
            className="w-24 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {saved ? <Check className="h-3.5 w-3.5" /> : null}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
