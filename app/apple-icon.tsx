import { ImageResponse } from "next/og";

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
          background: "#0B5CAB",
          borderRadius: 36,
        }}
      >
        <svg width="100" height="100" viewBox="0 0 24 24" fill="none">
          <path fill="#fff" d="M7 6.5h3.25v11H7V6.5Zm3.25 7.75H17V17h-6.75v-2.75Z" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
