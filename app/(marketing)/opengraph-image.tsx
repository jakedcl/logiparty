import { ImageResponse } from "next/og";
import { OgBrandLayout } from "@/lib/brand/og-content";

export const runtime = "edge";
export const alt = "Logiparty — event logistics operations for 3PLs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(<OgBrandLayout />, { ...size });
}
