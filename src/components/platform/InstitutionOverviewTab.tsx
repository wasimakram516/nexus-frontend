"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { formatDate, formatDateTime } from "@/lib/dateFormat";
import {
  AccountCircle,
  CalendarToday,
  Domain,
  Email,
  PersonAdd,
  Phone,
} from "@mui/icons-material";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { authService } from "@/services/auth.service";
import { usersService } from "@/services/users.service";

interface Props {
  institution: Record<string, unknown>;
  runtimeConfig: Record<string, unknown> | null;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

function InfoRow({ icon, label, value }: { icon: React.JSX.Element; label: string; value: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}>
      <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{value || "—"}</Typography>
      </Box>
    </Box>
  );
}

export default function InstitutionOverviewTab({ institution, runtimeConfig }: Props) {
  const { showMessage } = useMessage();
  const subscription = runtimeConfig?.subscription as Record<string, unknown> | null;
  const institutionId = String(institution.id ?? "");

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "" });
  const [adding, setAdding] = useState(false);

  const loadAdmins = useCallback(async () => {
    if (!institutionId) return;
    const { data } = await apiHandler<{ items: AdminUser[] }>(
      () => usersService.getAll({ institutionId, role: "ADMIN", limit: 50 }),
      { showMessage, silent: true }
    );
    setAdmins(data?.items ?? []);
    setAdminsLoading(false);
  }, [institutionId, showMessage]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const handleAddAdmin = async () => {
    setAdding(true);
    const { success } = await apiHandler(
      () =>
        authService.register({
          name: addForm.name,
          email: addForm.email,
          password: addForm.password,
          role: "ADMIN",
          institutionId,
        }),
      { showMessage, successMessage: "Admin account created." }
    );
    setAdding(false);
    if (success) {
      setAddOpen(false);
      setAddForm({ name: "", email: "", password: "" });
      loadAdmins();
    }
  };

  const trialEndsAt = typeof subscription?.endsAt === "string" ? subscription.endsAt : null;

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Institution Details</Typography>
            <InfoRow icon={<AccountCircle fontSize="small" />} label="Name" value={String(institution.name ?? "")} />
            <InfoRow icon={<Domain fontSize="small" />} label="Slug" value={String(institution.slug ?? "")} />
            <InfoRow icon={<Domain fontSize="small" />} label="Primary Domain" value={String(institution.primaryDomain ?? "")} />
            <InfoRow icon={<Email fontSize="small" />} label="Contact Email" value={String(institution.contactEmail ?? "")} />
            <InfoRow icon={<Phone fontSize="small" />} label="Contact Phone" value={String(institution.contactPhone ?? "")} />
            <InfoRow icon={<CalendarToday fontSize="small" />} label="Created" value={institution.createdAt ? formatDateTime(String(institution.createdAt)) : "—"} />
          </CardContent>
        </Card>

        {/* Administrators */}
        <Card sx={{ border: "1px solid", borderColor: "divider" }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Administrators</Typography>
              <Button size="small" variant="outlined" startIcon={<PersonAdd />} onClick={() => setAddOpen(true)}>
                Add Admin
              </Button>
            </Box>

            {adminsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}><CircularProgress size={22} /></Box>
            ) : admins.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No admin accounts yet — nobody can sign in to run this institution. Create one now.
              </Typography>
            ) : (
              <List dense disablePadding>
                {admins.map((admin) => (
                  <ListItem key={admin.id} disableGutters>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32, backgroundColor: "primary.main", fontSize: 13, fontWeight: 700 }}>
                        {admin.name.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={admin.name}
                      secondary={admin.email}
                      slotProps={{ primary: { variant: "body2", sx: { fontWeight: 600 } }, secondary: { variant: "caption" } }}
                    />
                    <Chip
                      label={admin.status}
                      size="small"
                      color={admin.status === "ACTIVE" ? "success" : "default"}
                      sx={{ height: 20, fontSize: 10 }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Deployment</Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip label={String(institution.status ?? "")} color={institution.status === "ACTIVE" ? "success" : institution.status === "SUSPENDED" ? "warning" : "default"} size="small" />
              <Chip label={String(institution.deploymentMode ?? "").replace(/_/g, " ")} variant="outlined" size="small" />
            </Box>
          </CardContent>
        </Card>

        {subscription && (
          <Card sx={{ border: "1px solid", borderColor: "divider", mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Subscription</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                <Chip label={String(subscription.status ?? "")} color={subscription.status === "ACTIVE" ? "success" : subscription.status === "TRIAL" ? "info" : "warning"} size="small" />
                {!!subscription.planName && <Chip label={String(subscription.planName)} variant="outlined" size="small" />}
                {subscription.status === "TRIAL" && trialEndsAt && (
                  <Chip
                    label={
                      new Date(trialEndsAt).getTime() < Date.now()
                        ? `Trial expired ${formatDate(trialEndsAt)}`
                        : `Trial ends ${formatDate(trialEndsAt)}`
                    }
                    color={new Date(trialEndsAt).getTime() < Date.now() ? "error" : "warning"}
                    size="small"
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Auto-renew: {subscription.autoRenew === true ? "Yes" : "No"}
              </Typography>
            </CardContent>
          </Card>
        )}

        {!!institution.notes && (
          <Card sx={{ border: "1px solid", borderColor: "divider" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Notes</Typography>
              <Typography variant="body2" color="text.secondary">{String(institution.notes)}</Typography>
            </CardContent>
          </Card>
        )}
      </Grid>

      {/* Add admin dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New Administrator</DialogTitle>
        <DialogContent sx={{ pt: "16px !important" }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField label="Full Name *" value={addForm.name} onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))} fullWidth slotProps={{ htmlInput: { autoComplete: "off", name: "new-admin-name" } }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Email *" type="email" value={addForm.email} onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))} fullWidth slotProps={{ htmlInput: { autoComplete: "off", name: "new-admin-email" } }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Password *" type="password" value={addForm.password} onChange={(e) => setAddForm((p) => ({ ...p, password: e.target.value }))} fullWidth helperText="At least 8 characters." slotProps={{ htmlInput: { autoComplete: "new-password", name: "new-admin-password" } }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddAdmin}
            disabled={adding || !addForm.name || !addForm.email || addForm.password.length < 8}
          >
            {adding ? <CircularProgress size={16} color="inherit" /> : "Create Admin"}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
