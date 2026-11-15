import { ImageResponse } from "next/og";
import { LogipartyArtwork } from "@/components/brand/logiparty-artwork";
import { BRAND } from "@/lib/brand/identity";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.paper,
          borderRadius: 36,
        }}
      >
        <LogipartyArtwork height={115.2} decorative />
      </div>
    ),
    { ...size }
  );
}
