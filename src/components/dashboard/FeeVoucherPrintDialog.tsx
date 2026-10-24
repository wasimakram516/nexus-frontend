"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, MenuItem, TextField } from "@mui/material";
import PrintSheet from "@/components/shared/PrintSheet";
import { FeeVoucherView } from "@/components/dashboard/FeeVoucherViews";
import { MONTHS, type NamedRow } from "@/components/dashboard/GenerateVouchersDialog";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { PrintableVoucher } from "@/lib/feeVoucherDocuments";
import { financeService } from "@/services/finance.service";

/** `own` prints through the student and guardian route, which checks the voucher belongs to them. */
export type VoucherPrintTarget = { kind: "single"; voucherId: string; own?: boolean } | { kind: "batch" };

interface FeeVoucherPrintDialogProps {
  target: VoucherPrintTarget | null;
  campuses: NamedRow[];
  classes: NamedRow[];
  onClose: () => void;
}

/**
 * Previews and prints fee vouchers: one voucher from its row, or a whole
 * month for a campus or class chosen above the preview.
 */
export default function FeeVoucherPrintDialog({ target, campuses, classes, onClose }: FeeVoucherPrintDialogProps) {
  const { showMessage } = useMessage();
  const now = new Date();
  const [campusId, setCampusId] = useState("");
  const [classId, setClassId] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [items, setItems] = useState<PrintableVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const yearNumber = Number(year);
  const batchReady = Boolean(campusId) && Number.isInteger(yearNumber) && yearNumber >= 2000;

  useEffect(() => {
    if (target?.kind === "batch") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- start each batch on the only campus when there is one
      setCampusId(campuses.length === 1 ? campuses[0].id : "");
      setClassId("");
      setItems([]);
    }
  }, [target?.kind, campuses]);

  const load = useCallback(async () => {
    if (!target) return;
    if (target.kind === "batch" && !batchReady) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data } =
      target.kind === "single"
        ? await apiHandler<PrintableVoucher>(
            () => (target.own ? financeService.getMyPrintableVoucher(target.voucherId) : financeService.getPrintableVoucher(target.voucherId)) as never,
            { showMessage },
          )
        : await apiHandler<PrintableVoucher[]>(
            () =>
              financeService.getPrintableVouchers({
                campusId,
                month: Number(month),
                year: yearNumber,
                ...(classId ? { classId } : {}),
              }) as never,
            { showMessage },
          );
    const loaded = Array.isArray(data) ? data : data ? [data] : null;
    setItems(loaded ?? []);
    setError(loaded ? null : "The vouchers could not be loaded.");
    setLoading(false);
  }, [target, batchReady, campusId, classId, month, yearNumber, showMessage]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load whenever a voucher or the batch choices change
    void load();
  }, [load]);

  if (!target) return <></>;

  const campusClasses = classes.filter((row) => row.campusId === campusId || !row.campusId);
  const controls =
    target.kind === "batch" ? (
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField select size="small" label="Campus" value={campusId} onChange={(e) => { setCampusId(e.target.value); setClassId(""); }} sx={{ minWidth: 180 }}>
          {campuses.map((campus) => (
            <MenuItem key={campus.id} value={campus.id}>{campus.name}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} disabled={!campusId} sx={{ minWidth: 180 }}>
          <MenuItem value="">All classes</MenuItem>
          {campusClasses.map((row) => (
            <MenuItem key={row.id} value={row.id}>{row.name}</MenuItem>
          ))}
        </TextField>
        <TextField select size="small" label="Month" value={month} onChange={(e) => setMonth(e.target.value)} sx={{ minWidth: 140 }}>
          {MONTHS.map((name, index) => (
            <MenuItem key={name} value={String(index + 1)}>{name}</MenuItem>
          ))}
        </TextField>
        <TextField size="small" label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} sx={{ width: 110 }} />
      </Box>
    ) : undefined;

  const empty = !loading && !error && items.length === 0;
  const emptyMessage = target.kind === "batch" && !batchReady ? "Choose a campus to preview the vouchers." : "There are no vouchers for this choice.";

  return (
    <PrintSheet
      open
      title={target.kind === "single" ? "Fee voucher" : "Fee vouchers"}
      loading={loading}
      error={error}
      onClose={onClose}
      controls={controls}
      landscape
    >
      {empty ? <Box className="no-print" sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>{emptyMessage}</Box> : null}
      {items.map((item) => (
        <FeeVoucherView key={item.voucher.id} item={item} />
      ))}
    </PrintSheet>
  );
}
