"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { DemoScreen } from "@/components/demo/demo-screens";
import { DEMO_STEPS, type DemoPopupPlacement } from "@/lib/demo/steps";

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 6;
const POPUP_W = 300;
const GAP = 12;

function measureHighlight(key: string): Rect | null {
  const nodes = document.querySelectorAll(
    `[data-demo-hl="${key}"]`
  ) as NodeListOf<HTMLElement>;
  // Prefer a visible target (sidebar brand is hidden on mobile).
  let el: HTMLElement | null = null;
  for (const node of nodes) {
    const r = node.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      el = node;
      break;
    }
  }
  if (!el) return null;
  el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
  const r = el.getBoundingClientRect();
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

function popupStyle(
  rect: Rect,
  placement: DemoPopupPlacement = "bottom"
): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxLeft = Math.max(12, vw - POPUP_W - 12);

  if (placement === "right") {
    return {
      top: Math.min(Math.max(12, rect.top), vh - 180),
      left: Math.min(rect.left + rect.width + GAP, maxLeft),
      width: POPUP_W,
    };
  }
  if (placement === "left") {
    return {
      top: Math.min(Math.max(12, rect.top), vh - 180),
      left: Math.max(12, rect.left - POPUP_W - GAP),
      width: POPUP_W,
    };
  }
  if (placement === "top") {
    return {
      top: Math.max(12, rect.top - GAP - 140),
      left: Math.min(
        Math.max(12, rect.left + rect.width / 2 - POPUP_W / 2),
        maxLeft
      ),
      width: POPUP_W,
    };
  }
  // bottom
  return {
    top: Math.min(rect.top + rect.height + GAP, vh - 160),
    left: Math.min(
      Math.max(12, rect.left + rect.width / 2 - POPUP_W / 2),
      maxLeft
    ),
    width: POPUP_W,
  };
}

/** Caret faces the highlighted UI (opposite of placement). */
function caretClass(placement: DemoPopupPlacement = "bottom"): string {
  switch (placement) {
    case "right":
      return "demo-caret demo-caret-left";
    case "left":
      return "demo-caret demo-caret-right";
    case "top":
      return "demo-caret demo-caret-bottom";
    default:
      return "demo-caret demo-caret-top";
  }
}

export function DemoTour() {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const step = DEMO_STEPS[index];
  const isFirst = index === 0;
  const isLast = index === DEMO_STEPS.length - 1;

  const next = useCallback(() => {
    if (isLast) {
      setFinished(true);
      return;
    }
    setIndex((i) => Math.min(i + 1, DEMO_STEPS.length - 1));
  }, [isLast]);

  const prev = useCallback(() => {
    setFinished(false);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const refresh = useCallback(() => {
    if (finished) {
      setRect(null);
      return;
    }
    const key = DEMO_STEPS[index]?.highlight;
    if (!key) {
      setRect(null);
      return;
    }
    // Screen swap needs paint before measure
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setRect(measureHighlight(key));
      });
    });
  }, [finished, index]);

  useLayoutEffect(() => {
    refresh();
  }, [refresh, step.screen]);

  useEffect(() => {
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, [refresh]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        if (finished) return;
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        // stay in demo — exit is the link
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, next, prev]);

  return (
    <div className="demo-app fixed inset-0 flex flex-col bg-[#f3f5f8]">
      {/* Slim demo chrome — not a marketing page */}
      <div className="relative z-50 flex items-center justify-between gap-3 border-b border-[#0b1526] bg-[#0b1526] px-3 py-2 text-[#f0f4fa] sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#9aabbf] hover:text-white"
          >
            Logiparty
          </Link>
          <span className="hidden text-[11px] text-[#9aabbf] sm:inline">
            Sample tour · not live data
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!finished ? (
            <span className="text-[11px] tabular-nums text-[#9aabbf]">
              {index + 1}/{DEMO_STEPS.length}
            </span>
          ) : null}
          <Link
            href="/#request"
            className="rounded-sm bg-[var(--m-accent,#c5e85a)] px-2.5 py-1 text-[11px] font-semibold text-[#0a0c0f]"
          >
            Request access
          </Link>
          <Link
            href="/"
            className="text-[11px] text-[#9aabbf] underline-offset-2 hover:text-white hover:underline"
          >
            Exit
          </Link>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div className="absolute inset-0 overflow-hidden">
          <DemoScreen screen={finished ? "dashboard" : step.screen} />
        </div>

        {/* Spotlight hole — giant box-shadow dims everything else */}
        {rect && !finished ? (
          <div
            aria-hidden
            className="demo-spotlight pointer-events-none fixed z-30 rounded-sm transition-[top,left,width,height] duration-300 ease-out"
            style={{
              top: rect.top,
              left: rect.left,
              width: Math.max(rect.width, 8),
              height: Math.max(rect.height, 8),
            }}
          />
        ) : null}

        {finished ? (
          <div className="fixed inset-0 z-30 bg-[#0b1526]/55" aria-hidden />
        ) : null}

        {/* In-app popup anchored to the highlight */}
        {!finished && rect ? (
          <div
            role="dialog"
            aria-labelledby="demo-pop-title"
            className="demo-popup fixed z-40 rounded-sm border border-[#c9d2de] bg-white p-4 text-[#0b1526] shadow-[0_12px_40px_rgba(0,0,0,0.28)] transition-[top,left] duration-300 ease-out"
            style={popupStyle(rect, step.placement)}
          >
            <span
              className={caretClass(step.placement)}
              aria-hidden
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5c6b7e]">
              {index + 1} of {DEMO_STEPS.length}
            </p>
            <h2
              id="demo-pop-title"
              className="mt-1.5 text-sm font-semibold tracking-tight"
            >
              {step.title}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#3d4a5c]">
              {step.body}
            </p>
            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                disabled={isFirst}
                className="inline-flex items-center gap-1 rounded-sm border border-[#c9d2de] px-2.5 py-1.5 text-xs font-medium text-[#3d4a5c] disabled:opacity-35"
              >
                <span aria-hidden>←</span> Back
              </button>
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1 rounded-sm bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white"
              >
                {isLast ? (
                  "Finish"
                ) : (
                  <>
                    Next <span aria-hidden>→</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : null}

        {finished ? (
          <div
            role="dialog"
            aria-labelledby="demo-done-title"
            className="fixed left-1/2 top-1/2 z-40 w-[min(92vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-[#c9d2de] bg-white p-6 text-center text-[#0b1526] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1e3a5f]">
              Stage → load → return
            </p>
            <h2
              id="demo-done-title"
              className="mt-3 text-lg font-semibold tracking-tight"
            >
              That’s the loop
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#3d4a5c]">
              Inventory and fleet unlock after load-out. Ready to talk?
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFinished(false);
                  setIndex(0);
                }}
                className="rounded-sm border border-[#c9d2de] px-3 py-2 text-xs font-medium text-[#3d4a5c]"
              >
                Replay
              </button>
              <Link
                href="/#request"
                className="rounded-sm bg-[#1e3a5f] px-4 py-2 text-xs font-semibold text-white"
              >
                Request access
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
