import { ImageResponse } from "next/og";

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
          background: "#0B5CAB",
          borderRadius: 7,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path fill="#fff" d="M7 6.5h3.25v11H7V6.5Zm3.25 7.75H17V17h-6.75v-2.75Z" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
