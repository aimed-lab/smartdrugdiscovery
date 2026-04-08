"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { type AppRole, roleRank } from "@/lib/roles";
import { validateToken, redeemInvitation } from "@/lib/invitations";

// ── User type ────────────────────────────────────────────────────────────────

export type AccountStatus = "active" | "pending_approval" | "invited" | "rejected" | "suspended";

export interface User {
  name: string;
  email: string;
  title: string;
  institution: string;
  avatar: string;
  avatarType?: "initials" | "emoji" | "photo";
  avatarPhoto?: string;
  role: AppRole;

  // ── Account status (invite + approval gate) ────────────────────────────
  accountStatus?: AccountStatus;  // defaults to "active" for legacy/seed users
  invitedBy?: string;             // email of inviter
  invitedAt?: string;             // ISO timestamp when invite was redeemed
  approvedBy?: string;            // email of admin who approved
  approvedAt?: string;            // ISO timestamp of approval

  // ── Researcher / social profiles ──────────────────────────────────────
  orgEmail?: string;
  orgEmailVerified?: boolean;
  linkedin?: string;
  twitter?: string;
  orcid?: string;

  // ── Ownership transfer (24-hr cooling-off period) ─────────────────────
  pendingOwnerTransfer?: {
    toEmail: string;
    initiatedAt: string;
  };
}

// ── Context type ─────────────────────────────────────────────────────────────

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  login: (email: string, inviteCode: string) => Promise<string | null>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  initiateOwnerTransfer: (toEmail: string) => void;
  cancelOwnerTransfer: () => void;
  /** Admin: get all users in the database */
  getAllUsers: () => Record<string, User>;
  /** Admin: change a user's role */
  updateUserRole: (email: string, newRole: AppRole) => void;
  /** Admin: approve a pending user */
  approveUser: (email: string) => void;
  /** Admin: reject a pending user */
  rejectUser: (email: string) => void;
  /** Admin: suspend an active user */
  suspendUser: (email: string) => void;
  /** Admin: reactivate a suspended/rejected user */
  reactivateUser: (email: string) => void;
  /** Force refresh user from DB (e.g. after approval check) */
  refreshUser: () => void;
}

// ── Persistent user database ─────────────────────────────────────────────────

const USER_DB_KEY = "sdd-user-db";
const AUTH_KEY    = "sdd-auth-user";

// ── Server sync helpers ─────────────────────────────────────────────────────

/** Retry a fetch up to `retries` times with exponential backoff. */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 2,
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, init);
      // Retry on 409 (SHA conflict) or 5xx
      if ((res.status === 409 || res.status >= 500) && i < retries) {
        await new Promise((r) => setTimeout(r, 300 * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (i < retries) await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastError;
}

/** Fetch a user record from the server registry. Returns null if unavailable. */
async function fetchUserFromServer(email: string): Promise<Partial<User> | null> {
  try {
    const res = await fetchWithRetry("/api/users", { method: "GET" }, 1);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.users?.length) return null;
    const match = data.users.find(
      (u: { email: string }) => u.email.toLowerCase() === email.toLowerCase()
    );
    return match ?? null;
  } catch {
    return null;
  }
}

const SEED_USERS: Record<string, User> = {
  "jakechen@gmail.com": {
    name: "Dr. Jake Chen",
    email: "jakechen@gmail.com",
    title: "Professor and Director",
    institution: "UAB Systems Pharmacology AI Research Center",
    avatar: "JC",
    role: "Owner",
    accountStatus: "active",
  },
};

function getUserDB(): Record<string, User> {
  try {
    const stored = localStorage.getItem(USER_DB_KEY);
    if (stored) return { ...SEED_USERS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return { ...SEED_USERS };
}

function saveUserToDB(user: User) {
  const db = getUserDB();
  db[user.email] = user;
  localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
}

function lookupOrCreateUser(email: string, overrides?: Partial<User>): User {
  const db = getUserDB();
  if (db[email]) {
    // If user exists, merge any new overrides (e.g. role from invitation)
    if (overrides) {
      const updated = { ...db[email], ...overrides };
      saveUserToDB(updated);
      return updated;
    }
    return db[email];
  }

  const namePart = email.split("@")[0].replace(/[._-]/g, " ");
  const name = namePart
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const parts = namePart.split(" ").filter(Boolean);
  const avatar =
    parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : namePart.slice(0, 2).toUpperCase();

  const newUser: User = {
    name,
    email,
    title: "",
    institution: email.split("@")[1],
    avatar,
    role: "User",
    accountStatus: "pending_approval",
    ...overrides,
  };
  saveUserToDB(newUser);
  return newUser;
}

// ── Provider ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [user, setUser]                       = useState<User | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem(AUTH_KEY);
    if (storedEmail) {
      const u = lookupOrCreateUser(storedEmail);
      // Ensure legacy users without accountStatus are treated as active
      if (!u.accountStatus) {
        u.accountStatus = "active";
        saveUserToDB(u);
      }
      setUser(u);
      setIsAuthenticated(true);

      // Fetch latest status from server (e.g. user was approved/suspended while offline)
      fetchUserFromServer(storedEmail).then((serverUser) => {
        if (!serverUser) return;
        const freshLocal = getUserDB()[storedEmail] ?? u;
        const merged: User = {
          ...freshLocal,
          ...(serverUser.accountStatus ? { accountStatus: serverUser.accountStatus as AccountStatus } : {}),
          ...(serverUser.role ? { role: serverUser.role as AppRole } : {}),
          ...(serverUser.approvedBy ? { approvedBy: serverUser.approvedBy as string } : {}),
          ...(serverUser.approvedAt ? { approvedAt: serverUser.approvedAt as string } : {}),
        };
        saveUserToDB(merged);
        setUser(merged);
      });
    }
    setLoading(false);
  }, []);

  // ── Server-side user registry sync (with retry) ──────────────────────────
  const syncUserToServer = (u: User, method: "POST" | "PUT" = "POST") => {
    fetchWithRetry("/api/users", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: u.email,
        name: u.name,
        role: u.role,
        accountStatus: u.accountStatus ?? "active",
        invitedBy: u.invitedBy,
        invitedAt: u.invitedAt,
        approvedBy: u.approvedBy,
        approvedAt: u.approvedAt,
        registeredAt: new Date().toISOString(),
      }),
    }).catch((err) => {
      console.warn("[SDD] Failed to sync user to server:", err);
    });
  };

  const login = async (email: string, inviteCode: string): Promise<string | null> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode  = inviteCode.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@"))
      return "Please enter a valid email address.";

    // ── 1. Check if user already exists locally (returning user) ────────
    const db = getUserDB();
    if (db[trimmedEmail]) {
      const existingUser = db[trimmedEmail];
      if (existingUser.accountStatus === "rejected")
        return "Your access request was not approved. Contact your administrator.";
      if (existingUser.accountStatus === "suspended")
        return "Your account has been suspended. Contact your administrator.";

      setUser(existingUser);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, trimmedEmail);

      // Fetch latest status from server (non-blocking update)
      fetchUserFromServer(trimmedEmail).then((serverUser) => {
        if (!serverUser) return;
        const fresh = getUserDB()[trimmedEmail] ?? existingUser;
        const merged: User = {
          ...fresh,
          ...(serverUser.accountStatus ? { accountStatus: serverUser.accountStatus as AccountStatus } : {}),
          ...(serverUser.role ? { role: serverUser.role as AppRole } : {}),
          ...(serverUser.approvedBy ? { approvedBy: serverUser.approvedBy as string } : {}),
          ...(serverUser.approvedAt ? { approvedAt: serverUser.approvedAt as string } : {}),
        };
        saveUserToDB(merged);
        setUser(merged);
      });
      return null;
    }

    // ── 2. Not in local DB — check server for existing account ──────────
    // This handles: user was approved on server, but is logging in from a
    // new browser / after clearing localStorage. They shouldn't need an
    // invite code again — the server already knows them.
    const serverUser = await fetchUserFromServer(trimmedEmail);
    if (serverUser && serverUser.accountStatus) {
      const status = serverUser.accountStatus as AccountStatus;
      if (status === "rejected")
        return "Your access request was not approved. Contact your administrator.";
      if (status === "suspended")
        return "Your account has been suspended. Contact your administrator.";

      // Reconstruct user locally from server data
      const namePart = (serverUser.name as string) || trimmedEmail.split("@")[0].replace(/[._-]/g, " ");
      const parts = namePart.split(" ").filter(Boolean);
      const avatar = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : namePart.slice(0, 2).toUpperCase();

      const restored: User = {
        name: (serverUser.name as string) || namePart,
        email: trimmedEmail,
        title: (serverUser.title as string) || "",
        institution: (serverUser.institution as string) || trimmedEmail.split("@")[1],
        avatar,
        role: (serverUser.role as AppRole) || "User",
        accountStatus: status,
        invitedBy: serverUser.invitedBy as string | undefined,
        invitedAt: serverUser.invitedAt as string | undefined,
        approvedBy: serverUser.approvedBy as string | undefined,
        approvedAt: serverUser.approvedAt as string | undefined,
      };
      saveUserToDB(restored);
      setUser(restored);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, trimmedEmail);
      return null;
    }

    // ── 3. Truly new user — must have a valid invitation token ──────────
    if (!trimmedCode)
      return "Invitation code is required for new accounts.";

    const invitation = validateToken(trimmedCode);
    if (!invitation)
      return "Invalid or expired invitation code. Please check and try again.";

    // Redeem the invitation locally
    const redeemed = redeemInvitation(trimmedCode, trimmedEmail);
    if (!redeemed)
      return "This invitation has already been used.";

    // Also redeem on server (async, non-blocking)
    fetchWithRetry("/api/invitations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "redeem", token: trimmedCode, acceptedBy: trimmedEmail }),
    }).catch((err) => console.warn("[SDD] Failed to sync invitation redemption:", err));

    // Create user with the invitation's assigned role
    const accountStatus: AccountStatus = redeemed.autoApprove ? "active" : "pending_approval";
    const u = lookupOrCreateUser(trimmedEmail, {
      role: redeemed.assignedRole,
      accountStatus,
      invitedBy: redeemed.createdBy,
      invitedAt: new Date().toISOString(),
      ...(redeemed.autoApprove ? { approvedBy: "auto", approvedAt: new Date().toISOString() } : {}),
    });

    // Sync new registration to server so admins see it immediately
    syncUserToServer(u);

    setUser(u);
    setIsAuthenticated(true);
    localStorage.setItem(AUTH_KEY, trimmedEmail);
    return null;
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    saveUserToDB(updated);
  };

  const initiateOwnerTransfer = (toEmail: string) => {
    if (!user || user.role !== "Owner") return;
    const updated = {
      ...user,
      pendingOwnerTransfer: { toEmail, initiatedAt: new Date().toISOString() },
    };
    setUser(updated);
    saveUserToDB(updated);
  };

  const cancelOwnerTransfer = () => {
    if (!user) return;
    const { pendingOwnerTransfer: _, ...rest } = user;
    const updated = { ...rest } as User;
    setUser(updated);
    saveUserToDB(updated);
  };

  const getAllUsers = (): Record<string, User> => getUserDB();

  const updateUserRole = (email: string, newRole: AppRole) => {
    // Enforce hierarchy: can only assign roles at or below your own level
    if (user && roleRank(newRole) < roleRank(user.role)) return;
    const db = getUserDB();
    // Cannot change Owner role unless you are Owner
    if (db[email]?.role === "Owner" && user?.role !== "Owner") return;
    if (db[email]) {
      db[email] = { ...db[email], role: newRole };
      localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
    }
    // If it's the current user, update state too
    if (user && user.email === email) setUser({ ...user, role: newRole });
    // Sync to server
    fetchWithRetry("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: newRole }),
    }).catch((err) => console.warn("[SDD] Failed to sync role change:", err));
  };

  const approveUser = (targetEmail: string) => {
    const lowerEmail = targetEmail.toLowerCase();
    const db = getUserDB();
    const now = new Date().toISOString();
    const approvedBy = user?.email ?? "unknown";
    // Update local DB if user exists there
    if (db[lowerEmail]) {
      db[lowerEmail] = { ...db[lowerEmail], accountStatus: "active", approvedBy, approvedAt: now };
      localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
      if (user && user.email === lowerEmail) {
        setUser({ ...user, accountStatus: "active", approvedBy, approvedAt: now });
      }
    }
    // Always sync to server (user may only exist server-side)
    fetchWithRetry("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: lowerEmail, accountStatus: "active", approvedBy, approvedAt: now }),
    }).then((res) => {
      if (!res.ok) console.error("[SDD] Server rejected approval:", res.status);
      else console.log("[SDD] Approval synced to server for:", lowerEmail);
    }).catch((err) => console.warn("[SDD] Failed to sync approval:", err));
  };

  const rejectUser = (targetEmail: string) => {
    const lowerEmail = targetEmail.toLowerCase();
    const db = getUserDB();
    if (db[lowerEmail]) {
      db[lowerEmail] = { ...db[lowerEmail], accountStatus: "rejected" };
      localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
    }
    fetchWithRetry("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: lowerEmail, accountStatus: "rejected" }),
    }).catch((err) => console.warn("[SDD] Failed to sync rejection:", err));
  };

  const suspendUser = (targetEmail: string) => {
    const lowerEmail = targetEmail.toLowerCase();
    const db = getUserDB();
    if (db[lowerEmail]) {
      db[lowerEmail] = { ...db[lowerEmail], accountStatus: "suspended" };
      localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
    }
    fetchWithRetry("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: lowerEmail, accountStatus: "suspended" }),
    }).catch((err) => console.warn("[SDD] Failed to sync suspension:", err));
  };

  const reactivateUser = (targetEmail: string) => {
    const lowerEmail = targetEmail.toLowerCase();
    const db = getUserDB();
    const now = new Date().toISOString();
    const approvedBy = user?.email ?? "unknown";
    if (db[lowerEmail]) {
      db[lowerEmail] = { ...db[lowerEmail], accountStatus: "active", approvedBy, approvedAt: now };
      localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
    }
    fetchWithRetry("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: lowerEmail, accountStatus: "active", approvedBy, approvedAt: now }),
    }).catch((err) => console.warn("[SDD] Failed to sync reactivation:", err));
  };

  const refreshUser = () => {
    if (!user) return;
    // First update from localStorage (immediate)
    const db = getUserDB();
    const local = db[user.email];
    if (local) setUser(local);

    // Then fetch from server (authoritative source for status changes)
    fetchUserFromServer(user.email).then((serverUser) => {
      if (!serverUser) return;
      const currentDB = getUserDB();
      const current = currentDB[user.email] ?? local ?? user;
      // Merge server data (server is authoritative for accountStatus, role, approvedBy, etc.)
      const merged: User = {
        ...current,
        ...(serverUser.accountStatus ? { accountStatus: serverUser.accountStatus as AccountStatus } : {}),
        ...(serverUser.role ? { role: serverUser.role as AppRole } : {}),
        ...(serverUser.approvedBy ? { approvedBy: serverUser.approvedBy as string } : {}),
        ...(serverUser.approvedAt ? { approvedAt: serverUser.approvedAt as string } : {}),
      };
      // Update both state and localStorage
      setUser(merged);
      saveUserToDB(merged);
    });
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated, loading, user, login, logout, updateUser,
        initiateOwnerTransfer, cancelOwnerTransfer,
        getAllUsers, updateUserRole, approveUser, rejectUser,
        suspendUser, reactivateUser, refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
