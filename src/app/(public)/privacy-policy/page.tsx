import type { Metadata } from "next";
import LegalPage from "@/components/public/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Nexus",
  description: "Nexus privacy policy — how we collect, use, and protect your data.",
};

const sections = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly — such as institution name, administrator contact details, and user account information (name, email, role). We also collect usage data such as login timestamps, session metadata, and feature usage to improve the platform. We do not collect any payment card information directly — payments are handled by third-party processors.",
  },
  {
    title: "2. How We Use Your Information",
    body: "We use your information to provide and operate the Nexus platform, authenticate users, communicate with you about your account and subscription, send service updates and security notices, and comply with applicable legal obligations. We do not sell, rent, or share your data with third parties for marketing purposes.",
  },
  {
    title: "3. Data Isolation",
    body: "Each institution's data is fully isolated at the database level using institution-scoped queries. Users of one institution cannot access, view, or modify the data of any other institution. Superadmin access is limited to Wisemen Soft platform operators only.",
  },
  {
    title: "4. Data Security",
    body: "All data transmitted between your browser and Nexus is encrypted using TLS 1.2 or higher. Passwords are hashed using bcrypt and never stored in plain text. Access tokens are short-lived (15 minutes) with secure, HttpOnly refresh token rotation via cookies. Session records are stored and validated server-side.",
  },
  {
    title: "5. Data Retention",
    body: "We retain your institution's data for as long as your subscription is active. Upon cancellation or account termination, data is retained for 30 days to allow for export, after which it is permanently deleted. Audit logs may be retained for a longer period as required by law.",
  },
  {
    title: "6. Your Rights",
    body: "You have the right to access, correct, or request deletion of your data at any time. Institution administrators can export data directly from the platform. To exercise rights on behalf of your institution, contact us at privacy@wisemensoft.com. We will respond to requests within 30 days.",
  },
  {
    title: "7. Cookies",
    body: "Nexus uses only essential cookies for authentication and session management. We do not use advertising, tracking, or analytics cookies. See our Cookie Policy for full details.",
  },
  {
    title: "8. Third-Party Services",
    body: "Nexus may use third-party services for infrastructure (hosting, database) and communication (email notifications). These providers are contractually bound to protect your data and may not use it for any other purpose.",
  },
  {
    title: "9. Changes to This Policy",
    body: "We may update this Privacy Policy periodically. We will notify institution administrators of material changes via email or an in-platform notice. Continued use of Nexus after changes constitutes acceptance of the updated policy.",
  },
  {
    title: "10. Contact",
    body: "For privacy-related enquiries, data requests, or to report a concern, contact us at privacy@wisemensoft.com.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="How Nexus collects, uses, and protects your institution's data."
      lastUpdated="January 2025"
      sections={sections}
    />
  );
}
