"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { MessageProvider } from "@/contexts/MessageContext";
import { AuthProvider } from "@/contexts/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <MessageProvider>
        <AuthProvider>{children}</AuthProvider>
      </MessageProvider>
    </ThemeProvider>
  );
}
