/** Shared layout for opengraph-image and twitter-image (1200×630). */
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
        background: "#F4F5F7",
        fontFamily: "IBM Plex Sans, Helvetica Neue, Helvetica, Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: "#0B5CAB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path fill="#fff" d="M7 6.5h3.25v11H7V6.5Zm3.25 7.75H17V17h-6.75v-2.75Z" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: "#1A1A1A",
              letterSpacing: "-0.02em",
            }}
          >
            Logiparty
          </div>
          <div style={{ fontSize: 22, color: "#3F4650", marginTop: 4 }}>
            Operations software for event-logistics 3PLs
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          border: "1px solid #AEB6BF",
          borderRadius: 10,
          background: "#FFFFFF",
          padding: 24,
          boxShadow: "0 4px 14px rgba(40, 70, 110, 0.08)",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#0B5CAB",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Jobs
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 12,
            fontSize: 18,
            color: "#1A1A1A",
          }}
        >
          <span style={{ fontWeight: 600 }}>Festival main stage</span>
          <span style={{ color: "#3F4650" }}>Ready · Load-out Fri 18:00</span>
        </div>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            flexDirection: "row",
            gap: 24,
            fontSize: 15,
            color: "#556274",
          }}
        >
          <span>Inventory locked</span>
          <span>2 trucks</span>
          <span>6 crew assigned</span>
        </div>
      </div>
    </div>
  );
}
