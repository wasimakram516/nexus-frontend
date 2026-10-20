import type { MetadataRoute } from "next";
import { BRAND_DESCRIPTOR, BRAND_NAME } from "@/lib/site-config";
import { BRAND_PALETTE } from "@/theme/tokens";

/** Describes the site as an installable web app: name, colors and icons. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND_NAME}: ${BRAND_DESCRIPTOR}`,
    short_name: BRAND_NAME,
    description: BRAND_DESCRIPTOR,
    start_url: "/",
    display: "standalone",
    background_color: BRAND_PALETTE.light.background.default,
    theme_color: BRAND_PALETTE.light.primary.main,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/icon.png", sizes: "600x600", type: "image/png" },
    ],
  };
}
