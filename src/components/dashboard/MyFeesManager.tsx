"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, CircularProgress } from "@mui/material";
import FamilyFeesView, { type FamilyFees } from "@/components/dashboard/FamilyFeesView";
import FeeVoucherPrintDialog, { type VoucherPrintTarget } from "@/components/dashboard/FeeVoucherPrintDialog";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { financeService } from "@/services/finance.service";

/**
 * A student's own fees, or every child's fees for a guardian, with a printable
 * voucher for anything still unpaid. The server returns only what the signed-in
 * person owns, so there is nothing to choose here.
 */
export default function MyFeesManager() {
  const { showMessage } = useMessage();
  const [family, setFamily] = useState<FamilyFees | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [printTarget, setPrintTarget] = useState<VoucherPrintTarget | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await apiHandler<FamilyFees>(() => financeService.getMyFees() as never, { showMessage, silent: true });
    const usable = data && Array.isArray(data.students) ? data : null;
    setFamily(usable);
    setError(usable ? null : "Your fees could not be loaded.");
    setLoading(false);
  }, [showMessage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load the fees when the page opens
    void load();
  }, [load]);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;
  if (error || !family) return <Alert severity="error">{error ?? "Your fees could not be loaded."}</Alert>;

  return (
    <>
      <FamilyFeesView family={family} onPrintVoucher={(voucherId) => setPrintTarget({ kind: "single", voucherId, own: true })} />
      <FeeVoucherPrintDialog target={printTarget} campuses={[]} classes={[]} onClose={() => setPrintTarget(null)} />
    </>
  );
}
