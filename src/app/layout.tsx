import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import Providers from "@/components/Providers";
import env from "@/config/env";
import { isIndexableDeployment } from "@/lib/seo";
import { BRAND_DESCRIPTOR, BRAND_NAME, COMPANY_NAME, COMPANY_URL, SITE_DESCRIPTION } from "@/lib/site-config";
import { BRAND_PALETTE } from "@/theme/tokens";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.nexusUrl),
  title: {
    default: `${BRAND_NAME}: ${BRAND_DESCRIPTOR}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: BRAND_NAME,
  authors: [{ name: COMPANY_NAME, url: COMPANY_URL }],
  creator: COMPANY_NAME,
  publisher: COMPANY_NAME,
  category: "technology",
  alternates: { canonical: "/" },
  // Preview deployments must never be indexed; the real site is.
  robots: isIndexableDeployment()
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
    : { index: false, follow: false },
  // The share image comes from the opengraph-image / twitter-image files.
  openGraph: { siteName: BRAND_NAME, locale: "en_US", type: "website", url: "/" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND_PALETTE.light.primary.main },
    { media: "(prefers-color-scheme: dark)", color: BRAND_PALETTE.dark.background.default },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${montserrat.variable}`} style={{ fontFamily: "var(--font-inter), sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
