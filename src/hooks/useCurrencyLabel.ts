"use client";

import { useEffect, useState } from "react";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { platformService } from "@/services/platform.service";

/** Written beside amounts until a school sets its own. */
export const DEFAULT_CURRENCY_LABEL = "Rs.";

/** The label a school chose in its finance settings, such as `SAR` or `AED`, or nothing when it has not. */
function labelFrom(settings: unknown): string | null {
  const finance = (settings as { finance?: unknown } | null | undefined)?.finance;
  const label = (finance as { currencyLabel?: unknown } | null | undefined)?.currencyLabel;
  return typeof label === "string" && label.trim() ? label.trim() : null;
}

/**
 * The currency written beside amounts for a school: its own setting, or `Rs.`
 * when it has none. A school's staff and families read it from their own
 * session; the platform console passes the institution it is looking at.
 *
 * @param {string} [institutionId] - The institution a superadmin is viewing.
 * @returns {string} The label to write beside an amount.
 */
export function useCurrencyLabel(institutionId?: string): string {
  const runtime = useOptionalRuntimeConfig();
  const [viewed, setViewed] = useState<string | null>(null);

  useEffect(() => {
    if (!institutionId) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await platformService.getRuntimeConfig(institutionId);
        if (!cancelled) setViewed(labelFrom(response.data?.data?.settings));
      } catch {
        if (!cancelled) setViewed(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [institutionId]);

  return (institutionId ? viewed : labelFrom(runtime?.config?.settings)) ?? DEFAULT_CURRENCY_LABEL;
}
