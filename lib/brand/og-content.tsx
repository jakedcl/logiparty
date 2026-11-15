import { LogipartyArtwork } from "@/components/brand/logiparty-artwork";
import { BRAND } from "@/lib/brand/identity";

/** Shared Handoff identity for Open Graph and Twitter (1200 × 630). */
export function OgBrandLayout() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: 56,
        background: BRAND.paper,
        color: BRAND.ink,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <LogipartyArtwork height={64} wordmark decorative />
        <div style={{ display: "flex", width: 22, height: 22, background: BRAND.coral }} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 86,
          fontWeight: 700,
          letterSpacing: "-0.045em",
          lineHeight: 1.05,
        }}
      >
        <span>Event logistics,</span>
        <span>in sync.</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 24,
          borderTop: "1px solid #D7DCD9",
          fontSize: 22,
          color: BRAND.cobalt,
        }}
      >
        <span>Inventory · Fleet · Crew · Client portal</span>
        <span>logiparty.com</span>
      </div>
    </div>
  );
}
