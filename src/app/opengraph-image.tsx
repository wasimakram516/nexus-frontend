import { renderShareImage } from "@/lib/og/share-image";
import { BRAND_DESCRIPTOR, BRAND_NAME, OG_MODULE_PILLS, SITE_DESCRIPTION } from "@/lib/site-config";

export const alt = `${BRAND_NAME}: ${BRAND_DESCRIPTOR}`;
// Next reads these two exports statically, so they must be literal values (a test checks they
// match the size the picture is drawn at).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social preview for the home page, and for every page without a picture of its own. */
export default function OpenGraphImage() {
  return renderShareImage({
    eyebrow: "Education ERP",
    title: BRAND_DESCRIPTOR,
    subtitle: SITE_DESCRIPTION,
    pills: OG_MODULE_PILLS,
  });
}
