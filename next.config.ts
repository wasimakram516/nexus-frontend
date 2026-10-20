import type { NextConfig } from "next";

/** Authenticated areas and auth screens: belt-and-braces with robots.txt, since a blocked URL can still be indexed from links. */
const PRIVATE_SOURCES = ["/dashboard/:path*", "/platform/:path*", "/login", "/signup"];

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  async headers() {
    return PRIVATE_SOURCES.map((source) => ({
      source,
      headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
    }));
  },
};

export default nextConfig;
