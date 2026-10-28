"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmContext";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { formatDateTime } from "@/lib/dateFormat";
import { deviceLabel } from "@/lib/deviceLabel";
import { authService } from "@/services/auth.service";

interface SessionRow {
  id: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  userAgent: string | null;
  ipAddress: string | null;
}

/** Whether a sign-in can still be used: not signed out and not past its end date. */
export function isActiveSession(session: SessionRow, now: Date = new Date()): boolean {
  return !session.revokedAt && new Date(session.expiresAt) > now;
}

/** The places the signed-in person is signed in, with a way to sign any of them out. */
export default function SessionsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showMessage } = useMessage();
  const confirm = useConfirm();
  const { clearAuth } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);

  const load = useCallback(async () => {
    const { data } = await apiHandler<SessionRow[]>(() => authService.getSessions(), { showMessage, silent: true });
    setSessions((data ?? []).filter((session) => isActiveSession(session)));
  }, [showMessage]);

  useEffect(() => {
    if (!open) return;
    const loadOnOpen = async () => {
      setSessions(null);
      await load();
    };
    void loadOnOpen();
  }, [open, load]);

  const signOut = async (session: SessionRow) => {
    const ok = await confirm({
      title: "Sign out this device",
      message: `Sign out ${deviceLabel(session.userAgent)}? Whoever is using it will need to sign in again.`,
      confirmLabel: "Sign Out",
      confirmColor: "warning",
    });
    if (!ok) return;
    const { success } = await apiHandler(() => authService.revokeSession(session.id), { showMessage, successMessage: "Device signed out." });
    if (success) await load();
  };

  const signOutEverywhere = async () => {
    const ok = await confirm({
      title: "Sign out everywhere",
      message: "This signs you out on every device, including this one.",
      confirmLabel: "Sign Out Everywhere",
      confirmColor: "warning",
    });
    if (!ok) return;
    const { success } = await apiHandler(() => authService.revokeAllSessions(), { showMessage, successMessage: "Signed out everywhere." });
    if (success) {
      clearAuth();
      window.location.assign("/login");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Where you&apos;re signed in</DialogTitle>
      <DialogContent>
        {sessions === null ? (
          <CircularProgress size={24} sx={{ display: "block", mx: "auto", my: 4 }} />
        ) : sessions.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 3 }}>No active sign-ins.</Typography>
        ) : (
          <List disablePadding>
            {sessions.map((session) => (
              <ListItem
                key={session.id}
                divider
                disableGutters
                secondaryAction={<Button size="small" color="warning" onClick={() => signOut(session)}>Sign out</Button>}
              >
                <ListItemText
                  primary={deviceLabel(session.userAgent)}
                  secondary={`Signed in ${formatDateTime(session.createdAt)}${session.ipAddress ? ` · ${session.ipAddress}` : ""}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button color="warning" onClick={signOutEverywhere} disabled={!sessions?.length}>Sign out everywhere</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
