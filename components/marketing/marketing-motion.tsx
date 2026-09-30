"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll theater for apex marketing:
 * - bay strip: data-active on nearest bay
 * - timeline: --m-timeline-progress on .marketing (0–1)
 */
export function MarketingMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = rootRef.current;
    const root = wrap?.closest<HTMLElement>(".marketing");
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bays = Array.from(root.querySelectorAll<HTMLElement>("[data-bay]"));
    const timeline = root.querySelector<HTMLElement>("[data-timeline]");
    const track = timeline?.querySelector<HTMLElement>("[data-timeline-track]");

    if (reduced) {
      bays[0]?.setAttribute("data-active", "true");
      root.style.setProperty("--m-timeline-progress", "1");
      return;
    }

    let frame = 0;

    const updateBays = () => {
      if (bays.length === 0) return;
      const mid = window.innerWidth / 2;
      const midY = window.innerHeight * 0.45;
      let best: HTMLElement | null = null;
      let bestDist = Infinity;

      for (const bay of bays) {
        const r = bay.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        // Prefer horizontal distance on wide bay strips; vertical on stacked.
        const dist =
          r.width > window.innerWidth * 0.5
            ? Math.abs(cy - midY)
            : Math.abs(cx - mid) * 0.6 + Math.abs(cy - midY) * 0.4;
        if (dist < bestDist) {
          bestDist = dist;
          best = bay;
        }
      }

      for (const bay of bays) {
        bay.setAttribute("data-active", bay === best ? "true" : "false");
      }
    };

    const updateTimeline = () => {
      if (!timeline || !track) return;
      const rect = track.getBoundingClientRect();
      const view = window.innerHeight;
      // Progress as track moves through the middle third of the viewport.
      const start = view * 0.65;
      const end = view * 0.25;
      const y = rect.top;
      let p = (start - y) / (start - end + rect.height * 0.35);
      p = Math.min(1, Math.max(0, p));
      root.style.setProperty("--m-timeline-progress", p.toFixed(4));
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        updateBays();
        updateTimeline();
      });
    };

    updateBays();
    updateTimeline();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    const bayScroller = root.querySelector<HTMLElement>("[data-bay-strip]");
    bayScroller?.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      bayScroller?.removeEventListener("scroll", onScroll);
    };
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
