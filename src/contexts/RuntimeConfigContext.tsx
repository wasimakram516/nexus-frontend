"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { platformService } from "@/services/platform.service";

export type ModuleKey =
  | "ACADEMICS"
  | "ATTENDANCE"
  | "FINANCE"
  | "PEOPLE"
  | "REPORTING"
  | "EXAMINATIONS"
  | "DOCUMENTS"
  | "REALTIME";

export type PermissionAction = "view" | "manage";

export type ModulePermissionMap = Record<string, { view: boolean; manage: boolean }>;

export interface RuntimeConfig {
  institutionId: string;
  branding: {
    displayName: string | null;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
    theme: string | null;
  } | null;
  settings: Record<string, unknown>;
  modules: Record<string, { enabled: boolean; configuration: Record<string, unknown> }>;
  subscription: {
    id: string;
    status: string;
    planId: string | null;
    planKey: string | null;
    planName: string | null;
    autoRenew: boolean;
    startsAt: string | null;
    endsAt: string | null;
  } | null;
  /** Effective module permissions for the current user; null = full access (admin-level). */
  permissions: ModulePermissionMap | null;
  /** True while an active trial unlocks every module. */
  trialFullAccess?: boolean;
}

interface RuntimeConfigValue {
  config: RuntimeConfig | null;
  isLoading: boolean;
  isModuleEnabled: (key: ModuleKey) => boolean;
  /** True when the current user may perform the action on the module. */
  can: (key: ModuleKey, action: PermissionAction) => boolean;
  /** Days until the trial ends; null when not on a dated trial. Negative = expired. */
  trialDaysLeft: number | null;
  refresh: () => Promise<void>;
}

const RuntimeConfigContext = createContext<RuntimeConfigValue | null>(null);

export function RuntimeConfigProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await platformService.getMyRuntimeConfig();
      setConfig(res.data?.data ?? null);
    } catch {
      setConfig(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !user.institutionId) {
      setIsLoading(false);
      return;
    }
    refresh();
  }, [authLoading, user, refresh]);

  const isModuleEnabled = useCallback(
    (key: ModuleKey) => Boolean(config?.modules?.[key]?.enabled),
    [config]
  );

  const can = useCallback(
    (key: ModuleKey, action: PermissionAction) => {
      if (user?.role === "SUPERADMIN" || user?.role === "ADMIN") return true;
      return Boolean(config?.permissions?.[key]?.[action]);
    },
    [config, user]
  );

  const trialDaysLeft = (() => {
    const sub = config?.subscription;
    if (!sub || sub.status !== "TRIAL" || !sub.endsAt) return null;
    return Math.ceil((new Date(sub.endsAt).getTime() - Date.now()) / 86_400_000);
  })();

  return (
    <RuntimeConfigContext.Provider
      value={{ config, isLoading, isModuleEnabled, can, trialDaysLeft, refresh }}
    >
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfig() {
  const ctx = useContext(RuntimeConfigContext);
  if (!ctx) throw new Error("useRuntimeConfig must be used within RuntimeConfigProvider");
  return ctx;
}

/**
 * Variant for components shared with the platform console, which renders
 * outside RuntimeConfigProvider — returns null there (treated as full access).
 */
export function useOptionalRuntimeConfig() {
  return useContext(RuntimeConfigContext);
}
