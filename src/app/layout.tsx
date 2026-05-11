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
  title: "Nexus — Education ERP for Schools, Colleges & Universities",
  description: "The all-in-one ERP for managing students, staff, fees, attendance, examinations, and campuses. Built by Wisemen Soft.",
  icons: {
    icon: "/icons/icon.svg",
  },
  openGraph: {
    title: "Nexus — Education ERP for Schools, Colleges & Universities",
    description: "The all-in-one ERP for managing students, staff, fees, attendance, examinations, and campuses.",
    url: "https://nexus.wisemensoft.com",
    siteName: "Nexus by Wisemen Soft",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Nexus — Education ERP" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nexus — Education ERP for Schools, Colleges & Universities",
    description: "The all-in-one ERP for managing students, staff, fees, attendance, examinations, and campuses.",
    images: ["/opengraph-image"],
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
