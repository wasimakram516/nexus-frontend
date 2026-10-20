import type { MetadataRoute } from "next";
import { absoluteUrl, isIndexableDeployment } from "@/lib/seo";
import { PRIVATE_ROUTE_PREFIXES } from "@/lib/site-config";

/**
 * Allows crawlers on the public marketing pages and keeps them out of the
 * authenticated app. Preview deployments block every crawler.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexableDeployment()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: [...PRIVATE_ROUTE_PREFIXES, "/api/"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
