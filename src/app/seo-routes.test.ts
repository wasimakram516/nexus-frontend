import { afterEach, describe, expect, it, vi } from "vitest";
import { featureModules } from "@/content/features";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { size as ogSize } from "@/app/opengraph-image";
import { SHARE_IMAGE_SIZE } from "@/lib/og/share-image";
import { PRIVATE_ROUTE_PREFIXES } from "@/lib/site-config";

afterEach(() => vi.unstubAllEnvs());

describe("robots", () => {
  it("allows the public site, hides private areas and points at the sitemap", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const r = robots();
    const rules = r.rules as { allow: string; disallow: string[] };
    expect(rules.allow).toBe("/");
    for (const prefix of PRIVATE_ROUTE_PREFIXES) expect(rules.disallow).toContain(prefix);
    expect(r.sitemap).toBe("http://localhost:3000/sitemap.xml");
  });

  it("blocks every crawler on preview deployments", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
  });
});

describe("sitemap", () => {
  const entries = sitemap();
  const urls = entries.map((e) => e.url);

  it("lists the public pages and every feature module, once each", () => {
    expect(urls).toContain("http://localhost:3000/");
    expect(urls).toContain("http://localhost:3000/pricing");
    for (const m of featureModules) expect(urls).toContain(`http://localhost:3000/features/${m.slug}`);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("never lists private routes and never stamps a fake build-time date", () => {
    for (const prefix of PRIVATE_ROUTE_PREFIXES) expect(urls.some((u) => new URL(u).pathname.startsWith(prefix))).toBe(false);
    expect(entries.every((e) => e.lastModified === undefined)).toBe(true);
  });
});

describe("share image", () => {
  it("declares the same size it draws at (Next reads the export statically)", () => {
    expect(ogSize).toEqual(SHARE_IMAGE_SIZE);
  });
});
