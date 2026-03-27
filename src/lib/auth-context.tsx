"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface User {
  name: string;
  email: string;
  institution: string;
  avatar: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null;
  login: (email: string, inviteCode: string) => string | null;
  logout: () => void;
}

const VALID_INVITE_CODES = ["SPARC2026"];

function getInitials(email: string): string {
  const name = email.split("@")[0].replace(/[._-]/g, " ");
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getDisplayName(email: string): string {
  const name = email.split("@")[0].replace(/[._-]/g, " ");
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("sdd-auth-user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("sdd-auth-user");
      }
    }
    setLoading(false);
  }, []);

  const login = (email: string, inviteCode: string): string | null => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = inviteCode.trim().toUpperCase();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return "Please enter a valid email address.";
    }
    if (!VALID_INVITE_CODES.includes(trimmedCode)) {
      return "Invalid invite code. Please check and try again.";
    }

    const domain = trimmedEmail.split("@")[1];
    const newUser: User = {
      name: getDisplayName(trimmedEmail),
      email: trimmedEmail,
      institution: domain,
      avatar: getInitials(trimmedEmail),
    };

    setUser(newUser);
    setIsAuthenticated(true);
    localStorage.setItem("sdd-auth-user", JSON.stringify(newUser));
    return null;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("sdd-auth-user");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
