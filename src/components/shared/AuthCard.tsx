"use client";

import Link from "next/link";
import { Box, Card, CardContent, Typography } from "@mui/material";
import NexusLogo from "@/components/shared/NexusLogo";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

/** The small centred card the account screens (forgot, reset and change password) share. */
export default function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "background.default", px: 2, py: 6 }}>
      <Box sx={{ width: "100%", maxWidth: 440 }}>
        <Box component={Link} href="/" sx={{ display: "flex", justifyContent: "center", mb: 3, textDecoration: "none" }}>
          <NexusLogo size={34} variant="full" />
        </Box>
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{subtitle}</Typography>
            )}
            {children}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
