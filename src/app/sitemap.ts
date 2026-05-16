import { MetadataRoute } from "next";
import { featureModules } from "@/content/features";

const BASE = "https://nexus.wisemensoft.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { url: BASE, priority: 1.0 },
    { url: `${BASE}/features`, priority: 0.9 },
    { url: `${BASE}/pricing`, priority: 0.9 },
    { url: `${BASE}/about`, priority: 0.7 },
    { url: `${BASE}/contact`, priority: 0.8 },
    { url: `${BASE}/faq`, priority: 0.7 },
    { url: `${BASE}/privacy-policy`, priority: 0.4 },
    { url: `${BASE}/terms-of-service`, priority: 0.4 },
    { url: `${BASE}/cookie-policy`, priority: 0.4 },
  ].map((r) => ({
    ...r,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
  }));

  const moduleRoutes = featureModules.map((m) => ({
    url: `${BASE}/features/${m.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...moduleRoutes];
}
