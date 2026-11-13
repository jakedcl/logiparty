import { ImageResponse } from "next/og";
import { LogipartyArtwork } from "@/components/brand/logiparty-artwork";
import { BRAND } from "@/lib/brand/identity";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <LogipartyArtwork height={26} decorative />
      </div>
    ),
    { ...size }
  );
}
