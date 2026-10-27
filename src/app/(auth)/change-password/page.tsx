"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, CircularProgress, TextField } from "@mui/material";
import AuthCard from "@/components/shared/AuthCard";
import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { validateNewPassword } from "@/lib/passwordRules";
import { authService } from "@/services/auth.service";

/**
 * Where a person goes first when an administrator set up their account: the
 * password they were given is only for getting in once.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, accessToken, isLoading, setAuth } = useAuth();
  const { showMessage } = useMessage();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  const problem = password ? validateNewPassword(password, confirmation) : null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const { success } = await apiHandler(() => authService.changePassword(current, password), {
      showMessage,
      successMessage: "Your password has been changed.",
    });
    setSaving(false);
    if (success && user && accessToken) {
      setAuth({ ...user, mustChangePassword: false }, accessToken);
      router.replace(user.role === "SUPERADMIN" ? "/platform" : "/dashboard");
    }
  };

  if (isLoading || !user) return null;

  return (
    <AuthCard
      title="Choose your own password"
      subtitle={user.mustChangePassword ? "Your account was set up for you, so please replace the password you were given." : "Enter your current password and choose a new one."}
    >
      {user.mustChangePassword && <Alert severity="info" sx={{ mb: 2 }}>You need to do this before using Nexus.</Alert>}
      <form onSubmit={submit}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <TextField label="Current password" type="password" value={current} onChange={(event) => setCurrent(event.target.value)} fullWidth required autoFocus autoComplete="current-password" />
          <TextField label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} fullWidth required autoComplete="new-password" />
          <TextField label="Confirm new password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} fullWidth required autoComplete="new-password" error={Boolean(confirmation) && password !== confirmation} helperText={problem ?? undefined} />
          <Button type="submit" variant="contained" size="large" disabled={saving || !current || !password || Boolean(problem)}>
            {saving ? <CircularProgress size={22} color="inherit" /> : "Change password"}
          </Button>
        </Box>
      </form>
    </AuthCard>
  );
}
