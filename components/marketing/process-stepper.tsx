"use client";

import { useState } from "react";

const STEPS = [
  {
    id: "stage",
    num: "01",
    title: "Stage",
    body: "Client assets sit in the warehouse. Reserve inventory, assign fleet and crew, and set load-in / load-out windows.",
    checklist: ["Reserve client assets", "Assign fleet + crew", "Set load-in window"],
  },
  {
    id: "load",
    num: "02",
    title: "Load",
    body: "Staff work assigned jobs only. Loaded quantities and documents live on the job for the dock and the venue.",
    checklist: ["Staff see assigned jobs only", "Loaded qty on run sheet", "Docs attached to job"],
  },
  {
    id: "return",
    num: "03",
    title: "Return",
    body: "After load-out ends, inventory and fleet locks release. Assets return to storage; the job moves to completed.",
    checklist: ["Locks release at load-out end", "Inventory back in storage", "Job marked completed"],
  },
] as const;

/** Warehouse loop — flat controls, no gloss orbs. */
export function ProcessStepper() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];

  return (
    <div className="m-stepper-flat">
      <div className="m-stepper-flat-tabs" role="tablist" aria-label="Warehouse loop">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={`m-stepper-flat-tab${i === active ? " m-stepper-flat-tab-active" : ""}`}
            onClick={() => setActive(i)}
          >
            <span className="m-stepper-flat-num">{s.num}</span>
            {s.title}
          </button>
        ))}
      </div>
      <div className="m-stepper-flat-panel" role="tabpanel">
        <p className="m-stepper-flat-body">{step.body}</p>
        <ul className="m-stepper-flat-list">
          {step.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
