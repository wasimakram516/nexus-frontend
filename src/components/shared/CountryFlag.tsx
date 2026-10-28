"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import { flagUrl } from "@/lib/countries";

/**
 * A country's flag as a small image. Operating systems such as Windows draw
 * flag emoji as two letters, so an image is the only way every viewer sees a
 * flag. When the image cannot load, the country's letters take its place.
 */
export default function CountryFlag({ iso, width = 20 }: { iso: string; width?: number }) {
  const [failed, setFailed] = useState(false);
  const height = Math.round(width * 0.75);

  if (failed) {
    return (
      <Box component="span" sx={{ width, fontSize: 11, fontWeight: 700, textAlign: "center", color: "text.secondary" }}>
        {iso}
      </Box>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a tiny remote flag, not worth the image optimiser
    <img
      src={flagUrl(iso, width * 2)}
      alt=""
      width={width}
      height={height}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
    />
  );
}
