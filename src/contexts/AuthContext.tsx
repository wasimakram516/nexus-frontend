"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type UserRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT"
  | "GUARDIAN"
  | "ACCOUNTANT";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId: string | null;
  sessionId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  updateToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("nexus-user");
    const token = sessionStorage.getItem("nexus-token");
    if (stored && token) {
      setUser(JSON.parse(stored));
      setAccessToken(token);
    }
    setIsLoading(false);
  }, []);

  const setAuth = useCallback((authUser: AuthUser, token: string) => {
    setUser(authUser);
    setAccessToken(token);
    sessionStorage.setItem("nexus-user", JSON.stringify(authUser));
    sessionStorage.setItem("nexus-token", token);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    sessionStorage.removeItem("nexus-user");
    sessionStorage.removeItem("nexus-token");
    document.cookie = "isAuthenticated=; path=/; max-age=0";
  }, []);

  const updateToken = useCallback((token: string) => {
    setAccessToken(token);
    sessionStorage.setItem("nexus-token", token);
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, setAuth, clearAuth, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
