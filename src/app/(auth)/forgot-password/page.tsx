"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Box, Button, CircularProgress, TextField, Typography } from "@mui/material";
import AuthCard from "@/components/shared/AuthCard";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const { showMessage } = useMessage();
  const [identifier, setIdentifier] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    const { success } = await apiHandler(() => authService.forgotPassword(identifier.trim()), {
      showMessage,
      silent: true,
    });
    setSending(false);
    // The server answers the same whether or not the account exists, so this does too.
    if (success) setSent(true);
  };

  return (
    <AuthCard title="Forgot your password?" subtitle="Enter the email, registration number or phone number you sign in with, and we will email you a link to choose a new one.">
      {sent ? (
        <Alert severity="success">
          If an account matches, a link to choose a new password has been sent to its email address. The link works for 30 minutes.
        </Alert>
      ) : (
        <form onSubmit={submit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Email / Registration No. / Phone"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              fullWidth
              required
              autoFocus
              autoComplete="username"
            />
            <Button type="submit" variant="contained" size="large" disabled={sending || !identifier.trim()}>
              {sending ? <CircularProgress size={22} color="inherit" /> : "Send reset link"}
            </Button>
          </Box>
        </form>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
        <Box component={Link} href="/login" sx={{ color: "primary.main", textDecoration: "none", fontWeight: 600 }}>
          Back to sign in
        </Box>
      </Typography>
    </AuthCard>
  );
}
