import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import Providers from "@/components/Providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nexus.wisemensoft.com"),
  title: "Nexus — Institute Management Platform",
  description: "Multi-campus institute management platform",
  icons: {
    icon: "/icons/icon.svg",
  },
  openGraph: {
    title: "Nexus — Multi-Campus Institute Management Platform",
    description: "The all-in-one ERP for schools and institutes.",
    url: "https://nexus.wisemensoft.com",
    siteName: "Nexus",
    images: [{ url: "/icons/social-banner.svg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus — Multi-Campus Institute Management Platform",
    description: "The all-in-one ERP for schools and institutes.",
    images: ["/icons/social-banner.svg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={dmSans.variable} style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
