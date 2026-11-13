/** Regenerate the approved vector/raster exports without extra dependencies.
 * Run: node --import tsx scripts/generate-brand-assets.ts
 */
import { writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ImageResponse } from "next/og";
import { LogipartyArtwork } from "../components/brand/logiparty-artwork";
import { BRAND, HANDOFF_L, HANDOFF_P } from "../lib/brand/identity";
import { OgBrandLayout } from "../lib/brand/og-content";

async function png(path: string, element: React.ReactElement, width: number, height: number) {
  const response = new ImageResponse(element, { width, height });
  await writeFile(path, Buffer.from(await response.arrayBuffer()));
}

async function main() {
  const mark = renderToStaticMarkup(createElement(LogipartyArtwork, { height: 64 }));
  const wordmark = renderToStaticMarkup(createElement(LogipartyArtwork, { height: 64, wordmark: true }));
  const reversed = renderToStaticMarkup(createElement(LogipartyArtwork, { height: 64, wordmark: true, reversed: true }));
  await writeFile("public/brand/logiparty-mark.svg", mark);
  await writeFile("public/brand/logiparty-wordmark.svg", wordmark);
  await writeFile("public/brand/logiparty-wordmark-reversed.svg", reversed);
  await writeFile("public/brand/logiparty-mark-mono.svg", mark.replaceAll(BRAND.cobalt, BRAND.ink).replaceAll(BRAND.coral, BRAND.ink));
  await writeFile("public/favicon.svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70" fill="none"><title>Logiparty</title><style>.l{stroke:${BRAND.cobalt}}@media(prefers-color-scheme:dark){.l{stroke:#FFFFFF}}</style><g transform="translate(0 3)" stroke-width="10" stroke-linejoin="round"><path class="l" d="${HANDOFF_L}"/><path stroke="${BRAND.coral}" d="${HANDOFF_P}"/></g></svg>`);

  for (const [name, size] of [["icon-192", 192], ["icon-512", 512], ["apple-touch-icon", 180]] as const) {
    const element = createElement("div", { style: {
      display: "flex", alignItems: "center", justifyContent: "center",
      width: "100%", height: "100%", background: BRAND.paper,
    } }, createElement(LogipartyArtwork, { height: size * 0.64, decorative: true }));
    await png(`public/brand/${name}.png`, element, size, size);
  }
  await png("public/og.png", createElement(OgBrandLayout), 1200, 630);
  console.log("Generated Handoff SVGs, favicons, install icons, and social image.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
