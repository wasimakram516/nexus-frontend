"use client";

import { useEffect, useState } from "react";
import { useOptionalRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { FALLBACK_COUNTRY, resolveCountry } from "@/lib/countries";
import { platformService } from "@/services/platform.service";

/**
 * The country a school's phone numbers usually belong to, so a local number
 * can be typed without choosing a code. A school's own staff and families read
 * it from their session; the platform console passes the institution it is
 * looking at. Until it is known, or when none is set, Pakistan.
 *
 * @param {string} [institutionId] - The institution a superadmin is viewing.
 * @returns {string} A country code such as "PK" or "AE".
 */
export function useDefaultCountry(institutionId?: string): string {
  const runtime = useOptionalRuntimeConfig();
  const [viewed, setViewed] = useState<string | null>(null);

  useEffect(() => {
    if (!institutionId) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await platformService.getRuntimeConfig(institutionId);
        if (!cancelled) setViewed(response.data?.data?.defaultCountry ?? null);
      } catch {
        if (!cancelled) setViewed(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [institutionId]);

  return resolveCountry((institutionId ? viewed : runtime?.config?.defaultCountry) ?? FALLBACK_COUNTRY);
}
