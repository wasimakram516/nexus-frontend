"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Chip } from "@mui/material";
import { CalendarMonth } from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
import { apiHandler } from "@/lib/apiHandler";
import { academicsService } from "@/services/academics.service";

interface CurrentAcademicYearResponse {
  academicYear: { id: string; name: string; startDate: string; endDate: string };
  effectiveStartDate: string;
  effectiveEndDate: string;
  isOverridden: boolean;
}

const ADMIN_ROLES = ["ADMIN", "SUPERADMIN"];

/**
 * Persistent, unobtrusive indicator of the institution's current academic
 * year for the sidebar's bottom icon row (next to ThemeToggle/profile/
 * logout) — structurally modeled on TrialBanner: reads runtime config,
 * resolves quietly in the background, and renders nothing when there's
 * nothing meaningful to show for the current user.
 *
 * A fresh institution with no current year set is an expected, common
 * state (not an error) — the resolver 404s, and only ADMIN/SUPERADMIN
 * (who can actually fix it) get a clickable nudge toward Academic Years;
 * everyone else sees nothing, since a permanent chip they can't act on
 * would just be noise.
 */
export default function AcademicYearSelector() {
  const { isModuleEnabled } = useRuntimeConfig();
  const { user } = useAuth();
  const { showMessage } = useMessage();
  const router = useRouter();

  const [current, setCurrent] = useState<CurrentAcademicYearResponse | null>(null);
  const [resolved, setResolved] = useState(false);

  const academicsEnabled = isModuleEnabled("ACADEMICS");

  useEffect(() => {
    if (!academicsEnabled) return;
    let cancelled = false;

    (async () => {
      // silent: true — a 404 here just means "no current year yet," a
      // routine state for a fresh institution, not something to toast.
      const { data } = await apiHandler<CurrentAcademicYearResponse>(
        () => academicsService.getCurrentAcademicYear(),
        { showMessage, silent: true }
      );
      if (cancelled) return;
      setCurrent(data);
      setResolved(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [academicsEnabled, showMessage]);

  if (!academicsEnabled || !resolved) return null;

  if (current) {
    return (
      <Chip
        icon={<CalendarMonth fontSize="small" />}
        label={current.academicYear.name}
        size="small"
        variant="outlined"
        sx={{ fontWeight: 600, maxWidth: "100%" }}
      />
    );
  }

  if (user && ADMIN_ROLES.includes(user.role)) {
    return (
      <Chip
        icon={<CalendarMonth fontSize="small" />}
        label="Set up academic year"
        size="small"
        color="warning"
        variant="outlined"
        onClick={() => router.push("/dashboard/academics")}
        sx={{ fontWeight: 600, cursor: "pointer" }}
      />
    );
  }

  return null;
}
