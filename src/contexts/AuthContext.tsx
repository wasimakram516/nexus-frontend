"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type UserRole =
  | "SUPERADMIN"
  | "ADMIN"
  | "STAFF"
  | "STUDENT"
  | "GUARDIAN";

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

/**
 * Reads the persisted auth pair from sessionStorage. Both the user record and
 * the token must be present together, otherwise the session is treated as
 * empty. Browser-only: never call this while rendering, only after mount.
 */
function readStoredAuth(): { user: AuthUser | null; token: string | null } {
  if (typeof window === "undefined") return { user: null, token: null };
  const stored = sessionStorage.getItem("nexus-user");
  const token = sessionStorage.getItem("nexus-token");
  if (!stored || !token) return { user: null, token: null };
  try {
    return { user: JSON.parse(stored) as AuthUser, token };
  } catch {
    return { user: null, token: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // The first render must match the server (no session, still loading), so the
  // stored session is restored after mount. Reading sessionStorage while rendering
  // makes the server HTML differ from the client and causes hydration errors.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = () => {
      const stored = readStoredAuth();
      setUser(stored.user);
      setAccessToken(stored.token);
      setIsLoading(false);
    };
    restoreSession();
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
