"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { type AppRole } from "@/lib/roles";
import { validateToken, redeemInvitation } from "@/lib/invitations";

// ── User type ────────────────────────────────────────────────────────────────

export type AccountStatus = "active" | "pending_approval" | "rejected" | "suspended";

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
  login: (email: string, inviteCode: string) => string | null;
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
    }
    setLoading(false);
  }, []);

  const login = (email: string, inviteCode: string): string | null => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode  = inviteCode.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@"))
      return "Please enter a valid email address.";

    // Check if user already exists (returning user)
    const db = getUserDB();
    if (db[trimmedEmail]) {
      const existingUser = db[trimmedEmail];
      // Returning users don't need invite code (they already have an account)
      // But if they're rejected/suspended, block them
      if (existingUser.accountStatus === "rejected")
        return "Your access request was not approved. Contact your administrator.";
      if (existingUser.accountStatus === "suspended")
        return "Your account has been suspended. Contact your administrator.";

      setUser(existingUser);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_KEY, trimmedEmail);
      return null;
    }

    // New user — must have a valid invitation token
    if (!trimmedCode)
      return "Invitation code is required for new accounts.";

    const invitation = validateToken(trimmedCode);
    if (!invitation)
      return "Invalid or expired invitation code. Please check and try again.";

    // Redeem the invitation
    const redeemed = redeemInvitation(trimmedCode, trimmedEmail);
    if (!redeemed)
      return "This invitation has already been used.";

    // Create user with the invitation's assigned role
    const accountStatus: AccountStatus = redeemed.autoApprove ? "active" : "pending_approval";
    const u = lookupOrCreateUser(trimmedEmail, {
      role: redeemed.assignedRole,
      accountStatus,
      invitedBy: redeemed.createdBy,
      invitedAt: new Date().toISOString(),
      ...(redeemed.autoApprove ? { approvedBy: "auto", approvedAt: new Date().toISOString() } : {}),
    });

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
    const db = getUserDB();
    if (!db[email]) return;
    db[email] = { ...db[email], role: newRole };
    localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
    // If it's the current user, update state too
    if (user && user.email === email) setUser({ ...user, role: newRole });
  };

  const approveUser = (targetEmail: string) => {
    const db = getUserDB();
    if (!db[targetEmail]) return;
    const now = new Date().toISOString();
    db[targetEmail] = {
      ...db[targetEmail],
      accountStatus: "active",
      approvedBy: user?.email ?? "unknown",
      approvedAt: now,
    };
    localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
    if (user && user.email === targetEmail) {
      setUser({ ...user, accountStatus: "active", approvedBy: user.email, approvedAt: now });
    }
  };

  const rejectUser = (targetEmail: string) => {
    const db = getUserDB();
    if (!db[targetEmail]) return;
    db[targetEmail] = { ...db[targetEmail], accountStatus: "rejected" };
    localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
  };

  const suspendUser = (targetEmail: string) => {
    const db = getUserDB();
    if (!db[targetEmail]) return;
    db[targetEmail] = { ...db[targetEmail], accountStatus: "suspended" };
    localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
  };

  const reactivateUser = (targetEmail: string) => {
    const db = getUserDB();
    if (!db[targetEmail]) return;
    db[targetEmail] = {
      ...db[targetEmail],
      accountStatus: "active",
      approvedBy: user?.email ?? "unknown",
      approvedAt: new Date().toISOString(),
    };
    localStorage.setItem(USER_DB_KEY, JSON.stringify(db));
  };

  const refreshUser = () => {
    if (!user) return;
    const db = getUserDB();
    const fresh = db[user.email];
    if (fresh) setUser(fresh);
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
