"use client";

import PublicNavbar from "@/components/public/PublicNavbar";
import PublicFooter from "@/components/public/PublicFooter";
import AiChatWidget from "@/components/public/AiChatWidget";
import ScrollToTop from "@/components/shared/ScrollToTop";
import { Box } from "@mui/material";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <PublicNavbar />
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      <PublicFooter />
      <ScrollToTop />
      <AiChatWidget />
    </Box>
  );
}
