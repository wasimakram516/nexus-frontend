"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Box, CircularProgress, TextField, Typography } from "@mui/material";
import FamilyFeesView, { type FamilyFees } from "@/components/dashboard/FamilyFeesView";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { financeService } from "@/services/finance.service";
import { peopleService } from "@/services/people.service";

interface GuardianRow {
  id: string;
  userId: string;
  campusId?: string;
  relation?: string;
}

interface FamilyBillingPanelProps {
  /** Guardian names by their user id, from the people already loaded by the Finance screen. */
  nameByUserId: Record<string, string>;
  /** Only guardians at these campuses are offered; null offers every campus the caller can see. */
  campusIds: string[] | null;
  onPrintVoucher?: (voucherId: string) => void;
}

/**
 * The front-desk view of a family: choose a guardian and see every child's
 * dues together, so a parent who comes in with several children is dealt with
 * once. Vouchers stay per child; this only gathers them.
 */
export default function FamilyBillingPanel({ nameByUserId, campusIds, onPrintVoucher }: FamilyBillingPanelProps) {
  const { showMessage } = useMessage();
  const [guardians, setGuardians] = useState<GuardianRow[] | null>(null);
  const [guardianId, setGuardianId] = useState<string | null>(null);
  const [family, setFamily] = useState<FamilyFees | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void apiHandler<GuardianRow[]>(() => peopleService.getGuardians() as never, { showMessage, silent: true }).then(({ data }) => {
      if (!cancelled) setGuardians(Array.isArray(data) ? data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [showMessage]);

  useEffect(() => {
    if (!guardianId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear the family when no guardian is chosen
      setFamily(null);
      return;
    }
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      const { data } = await apiHandler<FamilyFees>(() => financeService.getFamilyBilling(guardianId) as never, { showMessage, silent: true });
      if (cancelled) return;
      const usable = data && Array.isArray(data.students) ? data : null;
      setFamily(usable);
      setError(usable ? null : "The family's fees could not be loaded.");
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [guardianId, showMessage]);

  const options = useMemo(
    () =>
      (guardians ?? [])
        .filter((row) => !campusIds || (row.campusId && campusIds.includes(row.campusId)))
        .map((row) => ({ value: row.id, label: `${nameByUserId[row.userId] ?? "Guardian"}${row.relation ? ` (${row.relation.toLowerCase()})` : ""}` }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [guardians, campusIds, nameByUserId],
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>Family billing</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose a parent or guardian to see what all of their children owe, in one place.
      </Typography>
      <Autocomplete
        size="small"
        loading={guardians === null}
        options={options}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        onChange={(_event, option) => setGuardianId(option?.value ?? null)}
        renderInput={(params) => <TextField {...params} label="Guardian" />}
        sx={{ maxWidth: 420, mb: 2 }}
      />

      {!guardianId && <Alert severity="info">Choose a guardian to see their family.</Alert>}
      {error && <Alert severity="error">{error}</Alert>}
      {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>}
      {!loading && family && <FamilyFeesView family={family} onPrintVoucher={onPrintVoucher} />}
    </Box>
  );
}
