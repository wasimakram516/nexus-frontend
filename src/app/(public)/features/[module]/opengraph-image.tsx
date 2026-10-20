import { featureModules } from "@/content/features";
import { renderShareImage } from "@/lib/og/share-image";
import { BRAND_NAME } from "@/lib/site-config";

export const alt = `${BRAND_NAME} feature`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ module: string }>;
}

/** Prebuilds one preview picture per feature module. */
export function generateStaticParams() {
  return featureModules.map((m) => ({ module: m.slug }));
}

/** Social preview for one feature module: its name and summary. */
export default async function FeatureOpenGraphImage({ params }: Props) {
  const { module: slug } = await params;
  const mod = featureModules.find((m) => m.slug === slug);

  return renderShareImage({
    eyebrow: "Nexus Features",
    title: mod?.title ?? BRAND_NAME,
    subtitle: mod?.summary ?? "Connected education ERP modules.",
  });
}
