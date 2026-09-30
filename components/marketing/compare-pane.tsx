/** Before/after: spreadsheet chaos vs locked job UI. */
export function ComparePane() {
  return (
    <div className="m-compare">
      <div className="m-compare-pane m-compare-before">
        <div className="m-compare-head">Spreadsheet / group chat</div>
        <ul className="m-compare-list">
          <li className="m-compare-row m-compare-strike">
            Coolers qty??? — see thread
          </li>
          <li className="m-compare-row m-compare-strike">
            Load-out moved — who has the sheet?
          </li>
          <li className="m-compare-row m-compare-strike">
            Truck #? · crew TBD in Slack
          </li>
          <li className="m-compare-row m-compare-warn">File: Final_FINAL_v7.xlsx</li>
        </ul>
      </div>
      <div className="m-compare-pane m-compare-after">
        <div className="m-compare-head">Logiparty job</div>
        <ul className="m-compare-list">
          <li className="m-compare-row">
            <span>Waterfront Festival</span>
            <span className="m-mock-chip m-mock-chip-ready">ready</span>
          </li>
          <li className="m-compare-row">
            <span>Rolling Cooler</span>
            <span className="m-compare-lock">36 locked</span>
          </li>
          <li className="m-compare-row">
            <span>Load-out</span>
            <span className="m-mock-muted">Sep 19 · 22:00</span>
          </li>
          <li className="m-compare-row">
            <span>Crew + fleet</span>
            <span className="m-mock-muted">on the run sheet</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
