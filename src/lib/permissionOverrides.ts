import type { PermissionAction, PermissionCatalogFeature } from "@/contexts/RuntimeConfigContext";

export type OverrideEffect = "allow" | "deny";
export type PermissionOverrides = Record<string, Partial<Record<PermissionAction, OverrideEffect>>>;
export type PermissionMap = Record<string, Partial<Record<PermissionAction, boolean>>>;

export const PERMISSION_ACTIONS: PermissionAction[] = ["create", "read", "update", "delete"];

/** What a person is allowed to do before any personal changes: the role's grants, or the self-service defaults. */
export function isGrantedByBase(base: PermissionMap, feature: string, action: PermissionAction): boolean {
  return Boolean(base[feature]?.[action]);
}

/** What a person can actually do once their personal changes are applied on top of the base. */
export function isEffective(
  base: PermissionMap,
  overrides: PermissionOverrides,
  feature: string,
  action: PermissionAction,
): boolean {
  const override = overrides[feature]?.[action];
  if (override) return override === "allow";
  return isGrantedByBase(base, feature, action);
}

/** True when the person's setting differs from what the base gives. */
export function isCustomized(
  base: PermissionMap,
  overrides: PermissionOverrides,
  feature: string,
  action: PermissionAction,
): boolean {
  const override = overrides[feature]?.[action];
  if (!override) return false;
  return (override === "allow") !== isGrantedByBase(base, feature, action);
}

/**
 * Sets one permission to the wanted value. A value the base already gives is
 * stored as no change at all, so a person only carries the differences from
 * their role and follows the role for everything else.
 */
export function setPermission(
  base: PermissionMap,
  overrides: PermissionOverrides,
  feature: string,
  action: PermissionAction,
  wanted: boolean,
): PermissionOverrides {
  const entry = { ...(overrides[feature] ?? {}) };
  if (wanted === isGrantedByBase(base, feature, action)) delete entry[action];
  else entry[action] = wanted ? "allow" : "deny";

  const next = { ...overrides, [feature]: entry };
  if (Object.keys(entry).length === 0) delete next[feature];
  return next;
}

/** Sets one action on every listed feature that offers it. */
export function setPermissionForFeatures(
  base: PermissionMap,
  overrides: PermissionOverrides,
  features: PermissionCatalogFeature[],
  action: PermissionAction,
  wanted: boolean,
): PermissionOverrides {
  return features
    .filter((feature) => feature.actions.includes(action))
    .reduce((current, feature) => setPermission(base, current, feature.key, action, wanted), overrides);
}

/** Keeps only the changes that differ from the base, dropping empty entries. */
export function cleanOverrides(base: PermissionMap, overrides: PermissionOverrides): PermissionOverrides {
  let cleaned: PermissionOverrides = {};
  for (const [feature, entry] of Object.entries(overrides)) {
    for (const action of PERMISSION_ACTIONS) {
      const effect = entry[action];
      if (effect) cleaned = setPermission(base, cleaned, feature, action, effect === "allow");
    }
  }
  return cleaned;
}

/** How many permissions differ from the base. */
export function countCustomized(base: PermissionMap, overrides: PermissionOverrides): number {
  return Object.values(cleanOverrides(base, overrides)).reduce(
    (sum, entry) => sum + Object.keys(entry).length,
    0,
  );
}

/** How many personal changes are stored, whatever the person's role currently gives. */
export function countStoredOverrides(overrides: PermissionOverrides): number {
  return Object.values(overrides).reduce((sum, entry) => sum + Object.values(entry).filter(Boolean).length, 0);
}

/** How many permissions the person ends up with, out of how many exist. */
export function countAllowed(
  base: PermissionMap,
  overrides: PermissionOverrides,
  catalog: PermissionCatalogFeature[],
): { allowed: number; total: number } {
  let allowed = 0;
  let total = 0;
  for (const feature of catalog) {
    for (const action of feature.actions) {
      total += 1;
      if (isEffective(base, overrides, feature.key, action)) allowed += 1;
    }
  }
  return { allowed, total };
}
