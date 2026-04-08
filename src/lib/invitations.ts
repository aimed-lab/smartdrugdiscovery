/**
 * Invitation engine — per-user invite tokens with role hierarchy,
 * quotas, expiry, and admin-approval gate.
 *
 * Storage: localStorage["sdd-invitations"] as Invitation[]
 *          localStorage["sdd-platform-settings"] as PlatformSettings
 */

import { type AppRole, roleRank } from "./roles";

// ── Types ────────────────────────────────────────────────────────────────────

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface Invitation {
  id: string;
  token: string;            // 8-char alphanumeric (shared with invitee)
  createdBy: string;        // inviter email
  assignedRole: AppRole;    // role invitee receives on approval
  recipientHint?: string;   // optional pre-assigned email or name
  autoApprove: boolean;     // skip approval queue (Owner/Admin only)
  status: InvitationStatus;
  acceptedBy: string | null;
  createdAt: string;        // ISO
  expiresAt: string;        // ISO (default 14 days)
  acceptedAt: string | null;
  // Future: teamId?: string; tier?: "free" | "pro" | "enterprise";
}

export interface PlatformSettings {
  maxActiveUsers: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "sdd-invitations";
const SETTINGS_KEY = "sdd-platform-settings";

export const DEFAULT_MAX_ACTIVE_USERS = 50;

export const INVITE_QUOTAS: Record<AppRole, number> = {
  Owner: 999,
  Admin: 20,
  TechSupport: 5,
  Developer: 5,
  User: 2,
};

const TOKEN_EXPIRY_DAYS = 14;

// ── Helpers ──────────────────────────────────────────────────────────────────

function nanoid(len = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  const values = crypto.getRandomValues(new Uint8Array(len));
  for (let i = 0; i < len; i++) id += chars[values[i] % chars.length];
  return id;
}

export function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 for readability
  let token = "";
  const values = crypto.getRandomValues(new Uint8Array(8));
  for (let i = 0; i < 8; i++) token += chars[values[i] % chars.length];
  return token;
}

// ── Storage ──────────────────────────────────────────────────────────────────

function loadInvitations(): Invitation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveInvitations(invitations: Invitation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invitations));
}

export function getPlatformSettings(): PlatformSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { maxActiveUsers: DEFAULT_MAX_ACTIVE_USERS };
}

export function savePlatformSettings(settings: PlatformSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── Invitation CRUD ──────────────────────────────────────────────────────────

/**
 * Create a new invitation. Enforces:
 * - Role hierarchy: inviter can only assign roles at or below their own rank
 * - Quota: per-role limit on outstanding (pending) invitations
 * - autoApprove: only Owner/Admin can set this
 */
export function createInvitation(
  inviterEmail: string,
  inviterRole: AppRole,
  assignedRole: AppRole,
  recipientHint?: string,
  autoApprove?: boolean,
): Invitation | { error: string } {
  // Hierarchy check
  if (roleRank(assignedRole) < roleRank(inviterRole)) {
    return { error: "You cannot invite someone to a higher role than your own." };
  }

  // Auto-approve only for Admin+
  const canAutoApprove = roleRank(inviterRole) <= roleRank("Admin");
  const finalAutoApprove = autoApprove && canAutoApprove;

  // Quota check
  const remaining = getRemainingQuota(inviterEmail, inviterRole);
  if (remaining <= 0) {
    return { error: `Invite limit reached (${INVITE_QUOTAS[inviterRole]} max). Revoke or wait for expiry.` };
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const invitation: Invitation = {
    id: nanoid(),
    token: generateToken(),
    createdBy: inviterEmail,
    assignedRole,
    recipientHint: recipientHint || undefined,
    autoApprove: !!finalAutoApprove,
    status: "pending",
    acceptedBy: null,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    acceptedAt: null,
  };

  const all = loadInvitations();
  all.push(invitation);
  saveInvitations(all);

  // Sync to server (non-blocking)
  fetch("/api/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: invitation.id,
      token: invitation.token,
      createdBy: invitation.createdBy,
      assignedRole: invitation.assignedRole,
      recipientHint: invitation.recipientHint,
      autoApprove: invitation.autoApprove,
      expiresAt: invitation.expiresAt,
    }),
  }).catch((err) => console.warn("[SDD] Failed to sync invitation to server:", err));

  return invitation;
}

/**
 * Validate a token. Returns the invitation if it's pending and not expired.
 * Also handles the legacy SPARC2026 code by returning a synthetic invitation.
 */
export function validateToken(token: string): Invitation | null {
  const trimmed = token.trim().toUpperCase();

  // Legacy seed token — always valid for Owner bootstrap
  if (trimmed === "SPARC2026") {
    return {
      id: "seed-sparc2026",
      token: "SPARC2026",
      createdBy: "system",
      assignedRole: "Developer",
      autoApprove: true,
      status: "pending",
      acceptedBy: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2099-12-31T23:59:59.999Z",
      acceptedAt: null,
    };
  }

  const all = loadInvitations();
  const inv = all.find((i) => i.token.toUpperCase() === trimmed);
  if (!inv) return null;

  // Check expiry
  if (new Date(inv.expiresAt) < new Date()) {
    // Mark as expired
    inv.status = "expired";
    saveInvitations(all);
    return null;
  }

  if (inv.status !== "pending") return null;
  return inv;
}

/**
 * Redeem a token — marks it as accepted. Returns the invitation with the
 * assigned role so the caller can create the user with the right role.
 */
export function redeemInvitation(token: string, redeemerEmail: string): Invitation | null {
  const trimmed = token.trim().toUpperCase();

  // Legacy seed token — don't persist, just return it
  if (trimmed === "SPARC2026") {
    return {
      id: "seed-sparc2026",
      token: "SPARC2026",
      createdBy: "system",
      assignedRole: "Developer",
      autoApprove: true,
      status: "accepted",
      acceptedBy: redeemerEmail,
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2099-12-31T23:59:59.999Z",
      acceptedAt: new Date().toISOString(),
    };
  }

  const all = loadInvitations();
  const inv = all.find((i) => i.token.toUpperCase() === trimmed && i.status === "pending");
  if (!inv) return null;

  inv.status = "accepted";
  inv.acceptedBy = redeemerEmail;
  inv.acceptedAt = new Date().toISOString();
  saveInvitations(all);
  return inv;
}

/** Revoke a pending invitation by ID. */
export function revokeInvitation(id: string): boolean {
  const all = loadInvitations();
  const inv = all.find((i) => i.id === id && i.status === "pending");
  if (!inv) return false;
  inv.status = "revoked";
  saveInvitations(all);

  // Sync to server (non-blocking)
  fetch("/api/invitations", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  }).catch((err) => console.warn("[SDD] Failed to sync revocation to server:", err));

  return true;
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** Get all invitations created by a specific user. */
export function getInvitationsByUser(email: string): Invitation[] {
  return loadInvitations().filter((i) => i.createdBy === email);
}

/** Get all invitations (admin use). */
export function getAllInvitations(): Invitation[] {
  return loadInvitations();
}

/** Remaining invite quota for a user. Counts non-revoked, non-expired pending invites. */
export function getRemainingQuota(email: string, role: AppRole): number {
  const max = INVITE_QUOTAS[role];
  const used = loadInvitations().filter(
    (i) => i.createdBy === email && i.status === "pending" && new Date(i.expiresAt) > new Date()
  ).length;
  return Math.max(0, max - used);
}

/** Simple obfuscation for inviter email — not encryption, just prevents casual exposure in URLs. */
function obfuscate(str: string): string {
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

/** Reverse the obfuscation. */
export function deobfuscate(str: string): string {
  try {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (padded.length % 4)) % 4;
    return atob(padded + "=".repeat(pad));
  } catch { return str; }
}

/**
 * Build an invite link for a token. The link encodes the full invitation
 * payload so the recipient's browser can reconstruct the invitation record
 * (since invitations are stored in localStorage, which is per-browser).
 * The inviter's email is obfuscated to prevent casual exposure.
 */
export function buildInviteLink(token: string): string {
  const all = loadInvitations();
  const inv = all.find((i) => i.token === token);
  const base = typeof window !== "undefined" ? window.location.origin : "";

  if (!inv) return `${base}/login?invite=${token}`;

  // Encode key fields — obfuscate the inviter email
  const params = new URLSearchParams({
    invite: token,
    r: inv.assignedRole,
    aa: inv.autoApprove ? "1" : "0",
    by: obfuscate(inv.createdBy),
    exp: inv.expiresAt,
    id: inv.id,
  });
  if (inv.recipientHint) params.set("rh", inv.recipientHint);

  return `${base}/login?${params.toString()}`;
}

/**
 * Import an invitation from URL parameters into the local browser's storage.
 * This bridges the gap between the inviter's browser (where the invitation was
 * created) and the recipient's browser (which has no invitations in localStorage).
 * Called by the login page on load when URL params contain invitation data.
 */
export function importInvitationFromParams(params: URLSearchParams): void {
  const token = params.get("invite")?.trim().toUpperCase();
  const role  = params.get("r") as AppRole | null;
  const exp   = params.get("exp");
  const id    = params.get("id");
  const byRaw = params.get("by");
  // Deobfuscate inviter email (may be plain or obfuscated depending on version)
  const by    = byRaw ? (byRaw.includes("@") ? byRaw : deobfuscate(byRaw)) : null;

  // Need at minimum: token + role + expiry + id + createdBy
  if (!token || !role || !exp || !id || !by) return;

  // Don't import SPARC2026 — it's handled as a synthetic invitation
  if (token === "SPARC2026") return;

  const all = loadInvitations();

  // Don't duplicate if already imported
  if (all.some((i) => i.id === id)) return;

  const invitation: Invitation = {
    id,
    token,
    createdBy: by,
    assignedRole: role,
    recipientHint: params.get("rh") ?? undefined,
    autoApprove: params.get("aa") === "1",
    status: "pending",
    acceptedBy: null,
    createdAt: new Date().toISOString(),
    expiresAt: exp,
    acceptedAt: null,
  };

  all.push(invitation);
  saveInvitations(all);
}
