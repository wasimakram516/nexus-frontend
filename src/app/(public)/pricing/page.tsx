import type { Metadata } from "next";
import PricingClient from "@/components/public/PricingClient";
import env from "@/config/env";

export const metadata: Metadata = {
  title: "Pricing - Nexus Education ERP for Schools, Colleges & Campuses",
  description:
    "Explore Nexus Education ERP pricing for schools, colleges, and multi-campus institutions. Compare plans, billing options, included modules, AI-powered assistance, and rollout paths with clearer pricing guidance.",
};

async function getPlans() {
  try {
    const res = await fetch(`${env.apiBaseUrl}/api/${env.apiVersion}/platform/plans`, {
      cache: "no-store",
    });
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
