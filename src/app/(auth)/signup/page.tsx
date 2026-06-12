"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import {
  CheckCircleOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { authService, SignupResponse } from "@/services/auth.service";
import NexusLogo from "@/components/shared/NexusLogo";

const highlights = [
  "Free 14-day trial - no credit card required",
  "Your institution, campuses and admin account in one step",
  "Academics, attendance, people & finance included",
  "Upgrade to a paid plan whenever you are ready",
];

export default function SignupPage() {
  const [institutionName, setInstitutionName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuth();
  const { showMessage } = useMessage();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, success } = await apiHandler<SignupResponse>(
      () => authService.signupTrial({ institutionName, name, email, password }),
      { showMessage, successMessage: "Welcome to Nexus! Your trial is ready." }
    );
    if (success && data) {
      setAuth(
        {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role as never,
          institutionId: data.user.institutionId,
          sessionId: data.sessionId,
        },
        data.accessToken
      );
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `isAuthenticated=1; path=/; max-age=${maxAge}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      router.replace("/dashboard?welcome=1");
    }
    setLoading(false);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "background.default" }}>
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: 1,
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(160deg, #065f46 0%, #047857 40%, #059669 100%)",
          p: 6,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.05)" }} />
        <Box sx={{ position: "absolute", bottom: -60, left: -60, width: 250, height: 250, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.05)" }} />

        <Box component={Link} href="/" sx={{ textDecoration: "none", display: "inline-flex" }}>
          <NexusLogo size={36} variant="full" white />
        </Box>

        <Box>
          <Typography variant="h3" sx={{ fontWeight: 100, color: "#fff", mb: 1, lineHeight: 1.3 }}>
            Start your{" "}
            <Box component="span" sx={{ fontWeight: 800 }}>free trial</Box>{" "}
            today.
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)", mb: 5, maxWidth: 380 }}>
            Set up your institution in under a minute - we create your workspace and admin account together.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {highlights.map((item) => (
              <Box key={item} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <CheckCircleOutlined sx={{ color: "rgba(255,255,255,0.85)", fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
          © {new Date().getFullYear()} Nexus by Wisemen Soft
        </Typography>
      </Box>

      <Box
        sx={{
          width: { xs: "100%", md: 480 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          px: { xs: 3, sm: 6 },
          py: 6,
          backgroundColor: "background.paper",
          borderLeft: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: { xs: "flex", md: "none" }, justifyContent: "center", mb: 4 }}>
          <NexusLogo size={32} variant="full" />
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 100, mb: 0.5 }}>
          Create your{" "}
          <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>institution</Box>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          14-day free trial. No credit card needed.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <form onSubmit={handleSignup}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Institution Name"
              fullWidth
              required
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="e.g. Springfield Grammar School"
              autoFocus
            />
            <TextField
              label="Your Full Name"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              helperText="At least 8 characters."
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((p) => !p)} edge="end" size="small">
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading || password.length < 8 || !institutionName || !name || !email}
              sx={{ py: 1.5, mt: 1 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Start Free Trial"}
            </Button>
          </Box>
        </form>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: "center" }}>
          Already have an account?{" "}
          <Box component={Link} href="/login" sx={{ color: "primary.main", textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Box>
        </Typography>

        <Box sx={{ mt: "auto", pt: 6, textAlign: "center" }}>
          <Typography variant="caption" color="text.disabled">
            By signing up you agree to our{" "}
            <Box component={Link} href="/terms-of-service" sx={{ color: "primary.main", textDecoration: "none" }}>
              Terms of Service
            </Box>
            {" "}and{" "}
            <Box component={Link} href="/privacy-policy" sx={{ color: "primary.main", textDecoration: "none" }}>
              Privacy Policy
            </Box>
            .
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
