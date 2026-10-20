/**
 * Regenerates every static brand asset (SVG logos, PNG exports, favicon.ico) from the
 * colors in src/theme/tokens.ts, so a rebrand is a token change plus `npm run brand:assets`.
 * Static files cannot read the MUI theme at runtime, so this keeps them from drifting.
 *
 * Templates live in scripts/brand-assets/*.svg.tpl with {{MAIN}} / {{ACCENT}} / {{TILE}}
 * placeholders. The white logo variants contain no brand color and are left untouched.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { BRAND_PALETTE } = await import(pathToFileURL(path.join(root, "src/theme/tokens.ts")).href);

const palettes = {
  light: { MAIN: BRAND_PALETTE.light.primary.main, ACCENT: BRAND_PALETTE.light.primary.light },
  dark: { MAIN: BRAND_PALETTE.dark.primary.main, ACCENT: BRAND_PALETTE.dark.primary.light, TILE: BRAND_PALETTE.dark.background.default },
};

/** template, mode, svg output, optional png output with its pixel width. */
const assets = [
  { tpl: "icon.svg.tpl", mode: "light", svg: "public/icons/icon.svg", png: "public/icons/icon.png", width: 600 },
  { tpl: "logo-light-bg.svg.tpl", mode: "light", svg: "public/icons/logo-light-bg.svg", png: "public/icons/logo-light-bg.png", width: 600 },
  { tpl: "logo-dark-bg.svg.tpl", mode: "dark", svg: "public/icons/logo-dark-bg.svg", png: "public/icons/logo-dark-bg.png", width: 600 },
  { tpl: "logo-mark.svg.tpl", mode: "light", svg: "public/logos/logo-mark.svg", png: "public/logos/logo-mark.png", width: 800 },
  { tpl: "logo-full.svg.tpl", mode: "light", svg: "public/logos/logo-full.svg", png: "public/logos/logo-full.png", width: 2312 },
  { tpl: "app-icon.svg.tpl", mode: "dark", svg: "src/app/icon.svg" },
];

function render(template, colors) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!colors[key]) throw new Error(`No ${key} color for this asset`);
    return colors[key];
  });
}

/** Packs PNG buffers into an .ico (PNG-in-ICO, supported by every current browser). */
function toIco(pngs, sizes) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = Buffer.alloc(16 * pngs.length);
  let offset = header.length + entries.length;
  pngs.forEach((png, i) => {
    const e = i * 16;
    entries.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], e);
    entries.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], e + 1);
    entries.writeUInt16LE(1, e + 4);
    entries.writeUInt16LE(32, e + 6);
    entries.writeUInt32LE(png.length, e + 8);
    entries.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, entries, ...pngs]);
}

let faviconSvg = null;
for (const asset of assets) {
  const template = await readFile(path.join(root, "scripts/brand-assets", asset.tpl), "utf8");
  const svg = render(template, palettes[asset.mode]);
  const svgPath = path.join(root, asset.svg);
  await mkdir(path.dirname(svgPath), { recursive: true });
  await writeFile(svgPath, svg);
  if (asset.png) {
    await sharp(Buffer.from(svg), { density: 384 }).resize({ width: asset.width }).png().toFile(path.join(root, asset.png));
  }
  if (asset.tpl === "app-icon.svg.tpl") faviconSvg = svg;
  console.log("wrote", asset.svg, asset.png ?? "");
}

const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => sharp(Buffer.from(faviconSvg), { density: 384 }).resize(s, s).png().toBuffer()));
await writeFile(path.join(root, "src/app/favicon.ico"), toIco(pngs, sizes));
console.log("wrote src/app/favicon.ico");
