import type { MetadataRoute } from "next";
import { featureModules } from "@/content/features";
import { absoluteUrl } from "@/lib/seo";

/** Public, indexable pages and their relative importance. */
const PUBLIC_PAGES: ReadonlyArray<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: "/features", priority: 0.9 },
  { path: "/pricing", priority: 0.9 },
  { path: "/contact", priority: 0.8 },
  { path: "/about", priority: 0.7 },
  { path: "/faq", priority: 0.7 },
  { path: "/privacy-policy", priority: 0.3 },
  { path: "/terms-of-service", priority: 0.3 },
  { path: "/cookie-policy", priority: 0.3 },
];

/**
 * Lists every public URL. `lastModified` is deliberately omitted: stamping every
 * entry with the build time makes search engines stop trusting the field.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const modules = featureModules.map((m) => ({ path: `/features/${m.slug}`, priority: 0.8 }));
  return [...PUBLIC_PAGES, ...modules].map(({ path, priority }) => ({ url: absoluteUrl(path), priority }));
}
