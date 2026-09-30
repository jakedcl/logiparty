"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

function HeroToolbar() {
  return (
    <div className="m-window-hero-tools" aria-hidden>
      <span className="m-window-menu">
        <span className="m-window-menu-item">File</span>
        <span className="m-window-menu-item">View</span>
        <span className="m-window-menu-item">Help</span>
      </span>
      <span className="m-window-search">
        <span className="m-window-search-icon" />
        Search jobs…
      </span>
    </div>
  );
}

/** Early Mac / iOS-era window chrome for marketing mocks. */
export function AppWindow({
  title,
  toolbar,
  children,
  className = "",
  heroMotion = false,
  inset = false,
  heroChrome = false,
}: {
  title: string;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Float-in + subtle idle drift (hero only). */
  heroMotion?: boolean;
  /** Inset bevel + glass well around content. */
  inset?: boolean;
  /** Fake menu row + search field (hero). */
  heroChrome?: boolean;
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
      {heroChrome ? <HeroToolbar /> : null}
      {toolbar ? <div className="m-window-toolbar">{toolbar}</div> : null}
      <div className={`m-window-body${inset ? " m-window-body-inset" : ""}`}>
        {children}
      </div>
    </>
  );

  if (!heroMotion) {
    return (
      <div className={`m-window ${className}`.trim()}>{windowChrome}</div>
    );
  }

  return (
    <motion.div
      className={`m-window m-window-hero-glass ${className}`.trim()}
      initial={false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        animate={reduceMotion ? undefined : { y: [0, -4, 0, 3, 0] }}
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.55,
              }
        }
      >
        {windowChrome}
      </motion.div>
    </motion.div>
  );
}
