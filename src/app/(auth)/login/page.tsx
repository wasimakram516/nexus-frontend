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
  AccountBalance,
  Groups,
  SchoolOutlined,
  Today,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useAuth } from "@/contexts/AuthContext";
import { useMessage } from "@/contexts/MessageContext";
import { apiHandler } from "@/lib/apiHandler";
import { authService, LoginResponse } from "@/services/auth.service";
import NexusLogo from "@/components/shared/NexusLogo";

const features = [
  { icon: <SchoolOutlined />, label: "Academic Management" },
  { icon: <Groups />, label: "People & Enrollment" },
  { icon: <Today />, label: "Attendance Tracking" },
  { icon: <AccountBalance />, label: "Finance & Payroll" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuth();
  const { showMessage } = useMessage();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, success } = await apiHandler<LoginResponse>(
      () => authService.login({ email, password }),
      { showMessage, successMessage: "Welcome back!" }
    );
    if (success && data) {
      setAuth(
        {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role as never,
          institutionId: data.user.institutionId,
          sessionId: data.user.sessionId,
        },
        data.accessToken
      );
      const maxAge = 7 * 24 * 60 * 60;
      document.cookie = `isAuthenticated=1; path=/; max-age=${maxAge}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      router.replace(data.user.role === "SUPERADMIN" ? "/platform" : "/dashboard");
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
        <Box sx={{ position: "absolute", top: "40%", right: -40, width: 180, height: 180, borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.03)" }} />

        <Box component={Link} href="/" sx={{ textDecoration: "none", display: "inline-flex" }}>
          <NexusLogo size={36} variant="full" white />
        </Box>

        <Box>
          <Typography variant="h3" sx={{ fontWeight: 100, color: "#fff", mb: 1, lineHeight: 1.3 }}>
            Everything your{" "}
            <Box component="span" sx={{ fontWeight: 800 }}>institution</Box>{" "}
            needs,{" "}
            <Box component="span" sx={{ fontWeight: 800 }}>unified.</Box>
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)", mb: 5, maxWidth: 380 }}>
            Manage academics, attendance, finance, and people across every campus - from one platform.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {features.map((f) => (
              <Box key={f.label} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                  {f.icon}
                </Box>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
                  {f.label}
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
          Welcome{" "}
          <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>back</Box>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Sign in to your Nexus account to continue.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <form onSubmit={handleLogin}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
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
              disabled={loading}
              sx={{ py: 1.5, mt: 1 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Sign In"}
            </Button>
          </Box>
        </form>

        <Box sx={{ mt: "auto", pt: 6, textAlign: "center" }}>
          <Typography variant="caption" color="text.disabled">
            Having trouble? Contact{" "}
            <Box component="a" href="mailto:nexus@wisemensoft.com" sx={{ color: "primary.main", textDecoration: "none" }}>
              nexus@wisemensoft.com
            </Box>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
