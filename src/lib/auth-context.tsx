"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { type AppRole } from "@/lib/roles";

export interface User {
  name: string;
  email: string;
  title: string;
  institution: string;
  /** Initials string (e.g. "JC"), single emoji (e.g. "🧬"), or ignored when avatarType="photo" */
  avatar: string;
  /** How to render the avatar — defaults to "initials" */
  avatarType?: "initials" | "emoji" | "photo";
  /** Base64 data URL for photo avatar (set when avatarType="photo") */
  avatarPhoto?: string;
  role: AppRole;

  // ── Researcher / social profiles ──────────────────────────────────────────
  orgEmail?: string;          // institutional / org email
  orgEmailVerified?: boolean; // true once OTP flow completed
  linkedin?: string;          // linkedin.com/in/... URL
  twitter?: string;           // @handle
  orcid?: string;             // 0000-0000-0000-0000
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  login: (email: string, inviteCode: string) => string | null;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const VALID_INVITE_CODES = ["SPARC2026"];

// Persistent user database — keyed by email
const USER_DB_KEY = "sdd-user-db";
const AUTH_KEY    = "sdd-auth-user";

// Seed database with known users
const SEED_USERS: Record<string, User> = {
  "jakechen@gmail.com": {
    name: "Dr. Jake Chen",
    email: "jakechen@gmail.com",
    title: "Professor and Director",
    institution: "UAB Systems Pharmacology AI Research Center",
    avatar: "JC",
    role: "Owner",
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

function lookupOrCreateUser(email: string): User {
  const db = getUserDB();
  if (db[email]) return db[email];

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
  };
  saveUserToDB(newUser);
  return newUser;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [user, setUser]                       = useState<User | null>(null);

  useEffect(() => {
    const storedEmail = localStorage.getItem(AUTH_KEY);
    if (storedEmail) {
      const u = lookupOrCreateUser(storedEmail);
      setUser(u);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (email: string, inviteCode: string): string | null => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode  = inviteCode.trim().toUpperCase();
    if (!trimmedEmail || !trimmedEmail.includes("@"))
      return "Please enter a valid email address.";
    if (!VALID_INVITE_CODES.includes(trimmedCode))
      return "Invalid invite code. Please check and try again.";
    const u = lookupOrCreateUser(trimmedEmail);
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

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
