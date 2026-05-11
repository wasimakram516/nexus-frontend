import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/features", "/pricing", "/about", "/contact", "/faq"],
        disallow: ["/dashboard", "/platform", "/login", "/api/"],
      },
    ],
    sitemap: "https://nexus.wisemensoft.com/sitemap.xml",
  };
}
