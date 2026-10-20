import PricingClient from "@/components/public/PricingClient";
import env from "@/config/env";
import JsonLd from "@/components/seo/JsonLd";
import { pricingFaqs } from "@/content/pricing-faqs";
import { buildPageMetadata, faqJsonLd } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Pricing for Schools, Colleges & Campuses",
  description:
    "Compare Nexus Education ERP plans for schools, colleges, and multi-campus institutions: billing options, included modules, and AI assistance.",
  path: "/pricing",
});

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
  return (
    <>
      <JsonLd data={faqJsonLd(pricingFaqs.map((f) => ({ question: f.q, answer: f.a })))} />
      <PricingClient apiPlans={apiPlans} />
    </>
  );
}
