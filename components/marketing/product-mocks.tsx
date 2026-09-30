export type MockKind = "jobs" | "inventory" | "portal" | "staff";

export function MockJobs() {
  return (
    <div className="m-mock m-mock-flush">
      <div className="m-mock-bar">
        <span>Jobs</span>
        <span className="m-mock-muted">List · Calendar</span>
      </div>
      <div className="m-mock-rows">
        {[
          ["Waterfront Festival", "ready"],
          ["Campus Pop-Up", "upcoming"],
          ["Outdoor Patio", "draft"],
          ["Trade Show Wrap", "completed"],
        ].map(([name, status]) => (
          <div key={name} className="m-mock-row">
            <span>{name}</span>
            <span className={`m-mock-chip m-mock-chip-${status}`}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MockInventory() {
  return (
    <div className="m-mock m-mock-flush">
      <div className="m-mock-bar">
        <span>Inventory</span>
        <span className="m-mock-muted">Client · Equipment · Fleet</span>
      </div>
      <div className="m-mock-rows">
        {[
          ["SB-BAR-01", "Branded Bar", "10"],
          ["SB-COOLER", "Rolling Cooler", "36"],
          ["DOLLY-01", "Dolly", "40"],
          ["Box Truck 12", "Fleet", "NL-012"],
        ].map(([a, b, c]) => (
          <div key={a} className="m-mock-row m-mock-row-3">
            <span className="m-mock-mono">{a}</span>
            <span>{b}</span>
            <span className="m-mock-muted">{c}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MockPortal() {
  return (
    <div className="m-mock m-mock-flush">
      <div className="m-mock-bar m-mock-bar-brand">
        <span>Northline Logistics</span>
        <span className="m-mock-muted">Client portal</span>
      </div>
      <div className="m-mock-rows">
        <div className="m-mock-row">
          <span>Your jobs</span>
          <span className="m-mock-chip m-mock-chip-ready">ready</span>
        </div>
        <div className="m-mock-row">
          <span>Waterfront Festival</span>
          <span className="m-mock-muted">Sep 19</span>
        </div>
        <div className="m-mock-row">
          <span>Request inventory change</span>
          <span className="m-mock-muted">+24 coolers</span>
        </div>
      </div>
    </div>
  );
}

export function MockStaff() {
  return (
    <div className="m-mock m-mock-flush">
      <div className="m-mock-bar">
        <span>My Jobs</span>
        <span className="m-mock-muted">Staff</span>
      </div>
      <div className="m-mock-rows">
        <div className="m-mock-row">
          <span>Waterfront Festival</span>
          <span className="m-mock-chip m-mock-chip-ready">ready</span>
        </div>
        <div className="m-mock-row m-mock-row-3">
          <span>Branded Bar</span>
          <span className="m-mock-muted">3 assigned</span>
          <span className="text-[#1b6b2a]">3 loaded</span>
        </div>
        <div className="m-mock-row m-mock-row-3">
          <span>Dolly</span>
          <span className="m-mock-muted">10 assigned</span>
          <span className="text-[#1b6b2a]">10 loaded</span>
        </div>
      </div>
    </div>
  );
}

export function TourMock({ kind }: { kind: MockKind }) {
  switch (kind) {
    case "jobs":
      return <MockJobs />;
    case "inventory":
      return <MockInventory />;
    case "portal":
      return <MockPortal />;
    case "staff":
      return <MockStaff />;
  }
}
