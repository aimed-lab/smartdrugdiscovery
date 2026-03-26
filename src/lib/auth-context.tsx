"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface User {
  name: string;
  orcid: string;
  institution: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (inviteCode: string) => boolean;
  loginWithOrcid: () => void;
  logout: () => void;
  inviteVerified: boolean;
}

const VALID_INVITE_CODES = ["SPARC2026"];

const MOCK_ORCID_USER: User = {
  name: "Dr. Sarah Chen",
  orcid: "0000-0002-1234-5678",
  institution: "PharmaTech Research Inc.",
  email: "sarah.chen@pharmatech.com",
  avatar: "SC",
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inviteVerified, setInviteVerified] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("sdd-auth");
    if (stored === "true") {
      setIsAuthenticated(true);
      setInviteVerified(true);
      setUser(MOCK_ORCID_USER);
    }
  }, []);

  const login = (inviteCode: string): boolean => {
    if (VALID_INVITE_CODES.includes(inviteCode.trim().toUpperCase())) {
      setInviteVerified(true);
      return true;
    }
    return false;
  };

  const loginWithOrcid = () => {
    setUser(MOCK_ORCID_USER);
    setIsAuthenticated(true);
    localStorage.setItem("sdd-auth", "true");
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setInviteVerified(false);
    localStorage.removeItem("sdd-auth");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, loginWithOrcid, logout, inviteVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
