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

/** Build an invite link for a token. */
export function buildInviteLink(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/login?invite=${token}`;
  }
  return `/login?invite=${token}`;
}
