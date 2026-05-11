import type { Metadata } from "next";
import LegalPage from "@/components/public/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy — Nexus",
  description: "Nexus cookie policy — what cookies we use and why.",
};

const sections = [
  {
    title: "1. What Are Cookies",
    body: "Cookies are small text files placed on your device by a website. They allow the site to remember information across page loads and sessions — such as whether you are logged in.",
  },
  {
    title: "2. How Nexus Uses Cookies",
    body: "Nexus uses only essential cookies that are strictly necessary for the platform to function. We do not use cookies for advertising, behavioural tracking, or analytics. Every cookie we set serves a direct functional purpose.",
  },
  {
    title: "3. Authentication Cookie",
    body: "When you sign in, Nexus sets a secure, HttpOnly cookie containing your encrypted refresh token. This cookie is required for the automatic token refresh flow — it silently renews your access token in the background without requiring you to sign in again. Because it is HttpOnly, it cannot be read or modified by JavaScript, protecting it from cross-site scripting (XSS) attacks.",
  },
  {
    title: "4. Theme Preference",
    body: "Nexus stores your light/dark theme preference in the browser's localStorage (not a cookie). This is a client-side preference only and is never transmitted to our servers.",
  },
  {
    title: "5. No Tracking or Advertising Cookies",
    body: "We do not use Google Analytics, Facebook Pixel, Hotjar, Mixpanel, or any similar third-party tracking, analytics, or advertising tools. No data about your behaviour on Nexus is shared with advertising networks.",
  },
  {
    title: "6. Third-Party Cookies",
    body: "Nexus does not load third-party scripts that set cookies on our platform pages. If you access linked external sites (such as wisemensoft.com), those sites' cookie policies apply independently.",
  },
  {
    title: "7. Managing Cookies",
    body: "You can view and delete cookies through your browser settings at any time. Note that disabling the Nexus authentication cookie will prevent the automatic session refresh from working — you will be required to sign in manually on each visit.",
  },
  {
    title: "8. Changes to This Policy",
    body: "We may update this Cookie Policy if we change how we use cookies. Changes will be reflected on this page with an updated date.",
  },
  {
    title: "9. Contact",
    body: "For questions about our use of cookies, contact us at privacy@wisemensoft.com.",
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      subtitle="What cookies Nexus uses, why we use them, and how to manage them."
      lastUpdated="January 2025"
      sections={sections}
    />
  );
}
