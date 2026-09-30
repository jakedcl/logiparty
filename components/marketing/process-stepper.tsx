"use client";

import { useState } from "react";

const STEPS = [
  {
    id: "stage",
    num: "01",
    title: "Stage",
    body: "Client assets sit in the warehouse. You assign inventory, fleet, and crew with load-in / load-out windows.",
  },
  {
    id: "load",
    num: "02",
    title: "Load",
    body: "Staff work assigned jobs only. Loaded quantities and docs live on the job — ready for the dock and the venue.",
  },
  {
    id: "return",
    num: "03",
    title: "Return",
    body: "After load-out ends, inventory and fleet locks release. Assets go back to storage for the next activation.",
  },
] as const;

/** Glossy circular iOS-style process stepper. */
export function ProcessStepper() {
  const [active, setActive] = useState(0);

  return (
    <div className="m-stepper">
      <div className="m-stepper-track" aria-hidden>
        <div
          className="m-stepper-fill"
          style={{ width: `${(active / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
      <ol className="m-stepper-nodes">
        {STEPS.map((step, i) => {
          const selected = i === active;
          return (
            <li key={step.id} className="m-stepper-node">
              <button
                type="button"
                className={`m-stepper-btn${selected ? " m-stepper-btn-active" : ""}`}
                aria-pressed={selected}
                onClick={() => setActive(i)}
              >
                <span className="m-stepper-num">{step.num}</span>
              </button>
              <p className="m-stepper-label">{step.title}</p>
            </li>
          );
        })}
      </ol>
      <div className="m-stepper-panel" role="status">
        <p className="m-stepper-panel-title">{STEPS[active].title}</p>
        <p className="m-stepper-panel-body">{STEPS[active].body}</p>
      </div>
    </div>
  );
}
