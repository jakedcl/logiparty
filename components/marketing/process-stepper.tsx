"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

const STEPS = [
  {
    id: "stage",
    num: "01",
    title: "Stage",
    body: "Client assets sit in the warehouse. You assign inventory, fleet, and crew with load-in / load-out windows.",
    checklist: ["Reserve client assets", "Assign fleet + crew", "Set load-in window"],
  },
  {
    id: "load",
    num: "02",
    title: "Load",
    body: "Staff work assigned jobs only. Loaded quantities and docs live on the job — ready for the dock and the venue.",
    checklist: ["Staff see assigned jobs only", "Loaded qty on run sheet", "Docs attached to job"],
  },
  {
    id: "return",
    num: "03",
    title: "Return",
    body: "After load-out ends, inventory and fleet locks release. Assets go back to storage for the next activation.",
    checklist: ["Locks release at load-out end", "Inventory back in storage", "Job marked completed"],
  },
] as const;

/** Glossy circular iOS-style process stepper. */
export function ProcessStepper() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const fillTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 280, damping: 26 };
  const nodeTransition = reduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 420, damping: 22 };
  const step = STEPS[active];

  return (
    <div className="m-stepper">
      <div className="m-stepper-track" aria-hidden>
        <motion.div
          className="m-stepper-fill"
          animate={{ width: `${(active / (STEPS.length - 1)) * 100}%` }}
          transition={fillTransition}
        />
        <span className="m-stepper-track-shine" />
      </div>
      <ol className="m-stepper-nodes">
        {STEPS.map((s, i) => {
          const selected = i === active;
          return (
            <li key={s.id} className="m-stepper-node">
              <motion.button
                type="button"
                className={`m-stepper-btn${selected ? " m-stepper-btn-active" : ""}`}
                aria-pressed={selected}
                onClick={() => setActive(i)}
                animate={{ scale: selected ? 1.12 : 1 }}
                transition={nodeTransition}
              >
                <span className="m-stepper-gloss" aria-hidden />
                <span className="m-stepper-num">{s.num}</span>
              </motion.button>
              <p className="m-stepper-label">{s.title}</p>
            </li>
          );
        })}
      </ol>
      <div className="m-stepper-panel" role="status">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step.id}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.28 }}
          >
            <p className="m-stepper-panel-title">{step.title}</p>
            <p className="m-stepper-panel-body">{step.body}</p>
            <ul className="m-stepper-checklist">
              {step.checklist.map((item) => (
                <li key={item}>
                  <span className="m-stepper-check" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
