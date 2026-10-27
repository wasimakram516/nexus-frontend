"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import AuthCard from "@/components/shared/AuthCard";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { validateNewPassword } from "@/lib/passwordRules";
import { authService } from "@/services/auth.service";

function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const { showMessage } = useMessage();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const problem = password ? validateNewPassword(password, confirmation) : null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const { success } = await apiHandler(() => authService.resetPassword(token, password), { showMessage, silent: true });
    setSaving(false);
    if (success) setDone(true);
  };

  if (!token) {
    return (
      <AuthCard title="This link is incomplete">
        <Alert severity="warning" sx={{ mb: 2 }}>Open the link from your email again, or ask for a new one.</Alert>
        <Button component={Link} href="/forgot-password" variant="contained" fullWidth>Ask for a new link</Button>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Password changed">
        <Alert severity="success" sx={{ mb: 2 }}>Your password has been changed. Sign in with the new password.</Alert>
        <Button component={Link} href="/login" variant="contained" fullWidth>Go to sign in</Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" subtitle="Use at least 8 characters. Signing in again will be needed everywhere.">
      <form onSubmit={submit}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} fullWidth required autoFocus autoComplete="new-password" />
          <TextField label="Confirm new password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} fullWidth required autoComplete="new-password" error={Boolean(confirmation) && password !== confirmation} helperText={problem ?? undefined} />
          <Button type="submit" variant="contained" size="large" disabled={saving || !password || Boolean(problem)}>
            {saving ? <CircularProgress size={22} color="inherit" /> : "Change password"}
          </Button>
        </Box>
      </form>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
        <Box component={Link} href="/forgot-password" sx={{ color: "primary.main", textDecoration: "none", fontWeight: 600 }}>
          This link does not work? Ask for a new one
        </Box>
      </Typography>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams needs a Suspense boundary so the page can still be built statically.
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
