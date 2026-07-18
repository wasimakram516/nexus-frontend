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

export type PermissionAction = "create" | "read" | "update" | "delete";

export interface PermissionCatalogFeature {
  key: string;
  label: string;
  /** Plan module this feature is gated behind, or null for administrative features. */
  module: ModuleKey | null;
  /** The subset of CRUD actions meaningful for this feature. */
  actions: PermissionAction[];
}

/** Effective per-feature permission state, keyed by feature key. */
export type FeaturePermissionMap = Record<string, Partial<Record<PermissionAction, boolean>>>;

const WRITE_ACTIONS: PermissionAction[] = ["create", "update", "delete"];

/**
 * Fallback institution-branding colors for an institution that hasn't set
 * its own. Primary/secondary/accent follow the Wisemen Soft "Forest & Bone"
 * palette (see the parent site's styles/tokens.js); background intentionally
 * departs from it (wisemensoft's warm "bone" tone reads as beige/earthy in
 * a data-dense app) in favor of a neutral gray/white pair — matches Nexus's
 * own base theme in theme/theme.ts either way, and institutions can further
 * override any of the four roles.
 */
export const DEFAULT_BRANDING_COLORS = {
  light: { primaryColor: "#2C6B48", secondaryColor: "#6366F1", accentColor: "#4C8F68", backgroundColor: "#F7F8FA" },
  dark: { primaryColor: "#54A87A", secondaryColor: "#6366F1", accentColor: "#7CC79E", backgroundColor: "#141D18" },
};

export interface RuntimeConfig {
  institutionId: string;
  branding: {
    displayName: string | null;
    logoUrl: string | null;
    primaryColorLight: string | null;
    secondaryColorLight: string | null;
    accentColorLight: string | null;
    backgroundColorLight: string | null;
    primaryColorDark: string | null;
    secondaryColorDark: string | null;
    accentColorDark: string | null;
    backgroundColorDark: string | null;
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
  /** Effective feature permissions for the current user; null = full access (admin-level). */
  permissions: FeaturePermissionMap | null;
  /** Static feature x action reference list — same source the backend guard enforces against. */
  permissionCatalog: PermissionCatalogFeature[];
  /** True while an active trial unlocks every module. */
  trialFullAccess?: boolean;
}

interface RuntimeConfigValue {
  config: RuntimeConfig | null;
  isLoading: boolean;
  isModuleEnabled: (key: ModuleKey) => boolean;
  /** True when the current user may perform the action on the feature. */
  can: (featureKey: string, action: PermissionAction) => boolean;
  /** True when the user has read access to at least one feature in the module. */
  canViewModule: (key: ModuleKey) => boolean;
  /** True when the user has create/update/delete access to at least one feature in the module. */
  canManageModule: (key: ModuleKey) => boolean;
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

  const isAdminLevel = user?.role === "SUPERADMIN" || user?.role === "ADMIN";

  const can = useCallback(
    (featureKey: string, action: PermissionAction) => {
      if (isAdminLevel) return true;
      return Boolean(config?.permissions?.[featureKey]?.[action]);
    },
    [config, isAdminLevel]
  );

  const canAnyInModule = useCallback(
    (key: ModuleKey, actions: PermissionAction[]) => {
      if (isAdminLevel) return true;
      const features = config?.permissionCatalog?.filter((f) => f.module === key) ?? [];
      return features.some((feature) =>
        actions.some((action) => Boolean(config?.permissions?.[feature.key]?.[action]))
      );
    },
    [config, isAdminLevel]
  );

  const canViewModule = useCallback((key: ModuleKey) => canAnyInModule(key, ["read"]), [canAnyInModule]);
  const canManageModule = useCallback((key: ModuleKey) => canAnyInModule(key, WRITE_ACTIONS), [canAnyInModule]);

  const trialDaysLeft = (() => {
    const sub = config?.subscription;
    if (!sub || sub.status !== "TRIAL" || !sub.endsAt) return null;
    return Math.ceil((new Date(sub.endsAt).getTime() - Date.now()) / 86_400_000);
  })();

  return (
    <RuntimeConfigContext.Provider
      value={{ config, isLoading, isModuleEnabled, can, canViewModule, canManageModule, trialDaysLeft, refresh }}
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
