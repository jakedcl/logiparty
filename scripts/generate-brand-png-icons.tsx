/**
 * Generates manifest PNG icons from the Logiparty mark.
 * Run: npx tsx scripts/generate-brand-png-icons.tsx
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OgBrandLayout } from "../lib/brand/og-content";

async function renderIcon(pixel: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B5CAB",
          borderRadius: Math.round(pixel * 0.22),
        }}
      >
        <svg
          width={Math.round(pixel * 0.55)}
          height={Math.round(pixel * 0.55)}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path fill="#fff" d="M7 6.5h3.25v11H7V6.5Zm3.25 7.75H17V17h-6.75v-2.75Z" />
        </svg>
      </div>
    ),
    { width: pixel, height: pixel }
  );
}

async function main() {
  const outDir = join(process.cwd(), "public/brand");
  mkdirSync(outDir, { recursive: true });
  for (const size of [192, 512] as const) {
    const res = await renderIcon(size);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(join(outDir, `icon-${size}.png`), buf);
    console.log(`Wrote icon-${size}.png (${buf.length} bytes)`);
  }

  const og = new ImageResponse(<OgBrandLayout />, { width: 1200, height: 630 });
  const ogBuf = Buffer.from(await og.arrayBuffer());
  writeFileSync(join(process.cwd(), "public/og.png"), ogBuf);
  console.log(`Wrote public/og.png (${ogBuf.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
