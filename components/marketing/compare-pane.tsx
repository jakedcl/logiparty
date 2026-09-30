"use client";

import { motion, useReducedMotion } from "framer-motion";

const BEFORE_ROWS = [
  { key: "coolers", className: "m-compare-strike", text: "Coolers qty??? — see thread", col: "B" },
  { key: "loadout", className: "m-compare-strike", text: "Load-out moved — who has the sheet?", col: "C" },
  { key: "truck", className: "m-compare-strike", text: "Truck #? · crew TBD in Slack", col: "B" },
  { key: "file", className: "m-compare-warn", text: "Final_FINAL_v7.xlsx", col: "A" },
] as const;

const AFTER_ROWS = [
  { key: "job", left: "Waterfront Festival", right: <span className="m-mock-chip m-mock-chip-ready">ready</span>, locked: false },
  { key: "cooler", left: "Rolling Cooler", right: "36 locked", locked: true },
  { key: "loadout", left: "Load-out", right: "Sep 19 · 22:00", locked: false },
  { key: "crew", left: "Crew + fleet", right: "on the run sheet", locked: false },
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
        <div className="m-compare-ribbon">
          <span className="m-compare-ribbon-tab m-compare-ribbon-tab-active">Home</span>
          <span className="m-compare-ribbon-tab">Insert</span>
          <span className="m-compare-ribbon-tab">Data</span>
        </div>
        <div className="m-compare-head">
          <span>Spreadsheet / group chat</span>
          <span className="m-compare-formula">fx</span>
        </div>
        <div className="m-compare-cols" aria-hidden>
          <span />
          <span>A</span>
          <span>B</span>
          <span>C</span>
        </div>
        <motion.ul
          className="m-compare-list m-compare-list-sheet"
          variants={listVariants}
          initial={reduceMotion ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
        >
          {BEFORE_ROWS.map((row, i) => (
            <motion.li
              key={row.key}
              className="m-compare-sheet-row"
              variants={reduceMotion ? undefined : rowVariants}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="m-compare-row-num">{i + 2}</span>
              <span className={`m-compare-cell m-compare-cell-a ${row.className}`}>
                {row.col === "A" ? row.text : ""}
              </span>
              <span className={`m-compare-cell ${row.col === "B" ? row.className : ""}`}>
                {row.col === "B" ? (
                  <span className="m-compare-bubble m-compare-bubble-left">{row.text}</span>
                ) : (
                  ""
                )}
              </span>
              <span className={`m-compare-cell ${row.col === "C" ? row.className : ""}`}>
                {row.col === "C" ? (
                  <span className="m-compare-bubble m-compare-bubble-right">{row.text}</span>
                ) : (
                  ""
                )}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
      <div className="m-compare-pane m-compare-after">
        <div className="m-compare-head m-compare-head-app">
          <span className="m-compare-app-dots" aria-hidden>
            <span />
            <span />
            <span />
          </span>
          Logiparty job
        </div>
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
              <span className="m-compare-row-left">
                {row.locked ? <span className="m-lock-icon" aria-hidden /> : null}
                {row.left}
              </span>
              {row.locked ? (
                <span className="m-compare-lock">
                  <span className="m-lock-icon m-lock-icon-sm" aria-hidden />
                  {row.right}
                </span>
              ) : (
                <span className="m-compare-row-right">{row.right}</span>
              )}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </div>
  );
}
