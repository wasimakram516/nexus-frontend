import type { Metadata } from "next";
import PricingClient from "@/components/public/PricingClient";
import env from "@/config/env";

export const metadata: Metadata = {
  title: "Pricing — Nexus Education ERP",
  description:
    "Simple, transparent pricing for educational institutions of all sizes. Choose the plan that fits your campus count and feature needs.",
};

async function getPlans() {
  try {
    const res = await fetch(
      `${env.apiBaseUrl}/api/${env.apiVersion}/platform/plans`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data ?? [];
  } catch {
    return [];
  }
}

export default async function PricingPage() {
  const apiPlans = await getPlans();
  return <PricingClient apiPlans={apiPlans} />;
}
