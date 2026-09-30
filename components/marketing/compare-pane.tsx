"use client";

import { motion, useReducedMotion } from "framer-motion";

const BEFORE_ROWS = [
  { key: "coolers", className: "m-compare-row m-compare-strike", text: "Coolers qty??? — see thread" },
  { key: "loadout", className: "m-compare-row m-compare-strike", text: "Load-out moved — who has the sheet?" },
  { key: "truck", className: "m-compare-row m-compare-strike", text: "Truck #? · crew TBD in Slack" },
  { key: "file", className: "m-compare-row m-compare-warn", text: "File: Final_FINAL_v7.xlsx" },
] as const;

const AFTER_ROWS = [
  { key: "job", left: "Waterfront Festival", right: <span className="m-mock-chip m-mock-chip-ready">ready</span> },
  { key: "cooler", left: "Rolling Cooler", right: <span className="m-compare-lock">36 locked</span> },
  { key: "loadout", left: "Load-out", right: <span className="m-mock-muted">Sep 19 · 22:00</span> },
  { key: "crew", left: "Crew + fleet", right: <span className="m-mock-muted">on the run sheet</span> },
] as const;

const listVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

/** Before/after: spreadsheet chaos vs locked job UI. */
export function ComparePane() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="m-compare">
      <div className="m-compare-pane m-compare-before">
        <div className="m-compare-head">Spreadsheet / group chat</div>
        <motion.ul
          className="m-compare-list"
          variants={listVariants}
          initial={reduceMotion ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
        >
          {BEFORE_ROWS.map((row) => (
            <motion.li
              key={row.key}
              className={row.className}
              variants={reduceMotion ? undefined : rowVariants}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {row.text}
            </motion.li>
          ))}
        </motion.ul>
      </div>
      <div className="m-compare-pane m-compare-after">
        <div className="m-compare-head">Logiparty job</div>
        <motion.ul
          className="m-compare-list"
          variants={listVariants}
          initial={reduceMotion ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
        >
          {AFTER_ROWS.map((row) => (
            <motion.li
              key={row.key}
              className="m-compare-row"
              variants={reduceMotion ? undefined : rowVariants}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <span>{row.left}</span>
              {row.right}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </div>
  );
}
