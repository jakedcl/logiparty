"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

/** Early Mac / iOS-era window chrome for marketing mocks. */
export function AppWindow({
  title,
  toolbar,
  children,
  className = "",
  heroMotion = false,
}: {
  title: string;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Float-in + subtle idle drift (hero only). */
  heroMotion?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const windowChrome = (
    <>
      <div className="m-window-bar">
        <div className="m-window-dots" aria-hidden>
          <span className="m-window-dot m-window-dot-close" />
          <span className="m-window-dot m-window-dot-min" />
          <span className="m-window-dot m-window-dot-max" />
        </div>
        <p className="m-window-title">{title}</p>
        <span className="m-window-bar-spacer" aria-hidden />
      </div>
      {toolbar ? <div className="m-window-toolbar">{toolbar}</div> : null}
      <div className="m-window-body">{children}</div>
    </>
  );

  if (!heroMotion) {
    return (
      <div className={`m-window ${className}`.trim()}>{windowChrome}</div>
    );
  }

  return (
    <motion.div
      className={`m-window ${className}`.trim()}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      {reduceMotion ? (
        windowChrome
      ) : (
        <motion.div
          animate={{ y: [0, -4, 0, 3, 0] }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.55,
          }}
        >
          {windowChrome}
        </motion.div>
      )}
    </motion.div>
  );
}
