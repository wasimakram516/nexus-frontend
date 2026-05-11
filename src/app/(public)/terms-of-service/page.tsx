import type { Metadata } from "next";
import LegalPage from "@/components/public/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Nexus",
  description: "Nexus terms of service — your rights and responsibilities when using the platform.",
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using Nexus, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, you must not use the platform. These terms apply to all users including institution administrators, teachers, students, guardians, and accountants.",
  },
  {
    title: "2. Use of the Platform",
    body: "You may use Nexus only for lawful purposes and in accordance with these terms. Nexus is intended for use by educational institutions for managing academics, attendance, finance, and people. You are responsible for all activity that occurs under your account.",
  },
  {
    title: "3. Account Responsibilities",
    body: "Institution administrators are responsible for managing user accounts within their institution. You are responsible for maintaining the confidentiality of your login credentials. You must notify us immediately at nexus@wisemensoft.com if you become aware of any unauthorised access to your account.",
  },
  {
    title: "4. Subscription & Payment",
    body: "Access to Nexus is provided on a subscription basis. Subscriptions are billed in advance on the chosen billing cycle (monthly, quarterly, annual, or custom). All fees are non-refundable except where required by applicable law. We reserve the right to suspend or terminate access for accounts with overdue payments after reasonable notice.",
  },
  {
    title: "5. Data Ownership",
    body: "You retain full ownership of all data your institution inputs into Nexus — student records, attendance data, financial records, and all other institutional data. Wisemen Soft does not claim any intellectual property rights over your data. You may export your data at any time.",
  },
  {
    title: "6. Intellectual Property",
    body: "Nexus, including its interface, design, underlying technology, codebase, and all associated materials, is the intellectual property of Wisemen Soft. You are granted a limited, non-exclusive, non-transferable licence to use the platform during your subscription period. You may not copy, modify, reverse-engineer, or create derivative works from any part of the platform.",
  },
  {
    title: "7. Acceptable Use",
    body: "You must not use Nexus to store unlawful content, attempt to gain unauthorised access to other institutions' data, perform security attacks or penetration testing without written permission, or use the platform in any way that could damage, disable, or impair the service for other users.",
  },
  {
    title: "8. Service Availability",
    body: "We aim to maintain high availability of the Nexus platform. However, we do not guarantee uninterrupted access and may perform scheduled or emergency maintenance. We will provide advance notice of planned downtime where possible.",
  },
  {
    title: "9. Termination",
    body: "We may terminate or suspend your institution's access if you materially violate these terms, after providing reasonable notice where practical. You may cancel your subscription at any time. Upon termination, your data will be retained for 30 days before permanent deletion.",
  },
  {
    title: "10. Limitation of Liability",
    body: "To the maximum extent permitted by applicable law, Wisemen Soft shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, Nexus. Our total liability shall not exceed the amount paid by your institution in the 12 months preceding the claim.",
  },
  {
    title: "11. Changes to Terms",
    body: "We may update these Terms of Service periodically. We will notify institution administrators of material changes via email or in-platform notice at least 14 days before they take effect. Continued use of Nexus after changes take effect constitutes acceptance of the updated terms.",
  },
  {
    title: "12. Governing Law",
    body: "These terms are governed by the laws of Pakistan. Any disputes arising from these terms or your use of Nexus shall be subject to the jurisdiction of the courts of Pakistan, without prejudice to any mandatory local consumer protection laws that may apply.",
  },
  {
    title: "13. Contact",
    body: "For questions about these terms, contact us at legal@wisemensoft.com.",
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Terms of Service"
      subtitle="Your rights and responsibilities when using the Nexus platform."
      lastUpdated="January 2025"
      sections={sections}
    />
  );
}
