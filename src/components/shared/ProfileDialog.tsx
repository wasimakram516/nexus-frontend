"use client";

import { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { usersService } from "@/services/users.service";

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
}

/** Edit the signed-in user's own profile (name, email, password). */
export default function ProfileDialog({ open, onClose }: ProfileDialogProps) {
  const { user, accessToken, setAuth } = useAuth();
  const { showMessage } = useMessage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiHandler<Profile>(() => usersService.getMe(), { showMessage, silent: true }).then(({ data }) => {
      setForm({ name: data?.name ?? "", email: data?.email ?? "", password: "" });
      setLoading(false);
    });
  }, [open, showMessage]);

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = {};
    if (form.name) payload.name = form.name;
    if (form.email) payload.email = form.email;
    if (form.password) payload.password = form.password;

    const { data, success } = await apiHandler<Profile>(
      () => usersService.updateMe(payload),
      { showMessage, successMessage: "Profile updated." }
    );
    setSaving(false);
    if (success) {
      if (data && user && accessToken) {
        setAuth({ ...user, name: data.name, email: data.email }, accessToken);
      }
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>My Profile</DialogTitle>
      <DialogContent sx={{ pt: "16px !important" }}>
        {loading ? (
          <Grid container sx={{ py: 4, justifyContent: "center" }}><CircularProgress size={24} /></Grid>
        ) : (
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Full Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} fullWidth />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} fullWidth />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="New Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                fullWidth
                helperText="Leave blank to keep your current password."
                slotProps={{ htmlInput: { autoComplete: "new-password" } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.disabled">
                Signed in as {user?.role}. Role and access are managed by your administrator.
              </Typography>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading || !form.name || !form.email || (form.password.length > 0 && form.password.length < 8)}
        >
          {saving ? <CircularProgress size={16} color="inherit" /> : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
