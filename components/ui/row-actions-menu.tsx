"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Placement = "bottom" | "top";

type Coords = {
  top: number;
  left: number;
  placement: Placement;
};

const MENU_GAP = 4;
const MENU_MIN_WIDTH = 120;

/**
 * Dense ⋯ row menu that portals to `document.body` with `position: fixed`.
 * Escapes `overflow-x: auto` table wrappers (`.lp-table-wrap`) and flips
 * upward when there isn't enough space below the trigger.
 */
export function RowActionsMenu({
  children,
  label = "More actions",
  align = "end",
  menuClassName,
}: {
  children: ReactNode;
  label?: string;
  /** Horizontal alignment relative to the trigger. */
  align?: "start" | "end";
  menuClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuEl = menuRef.current;
    const menuHeight = menuEl?.offsetHeight ?? 96;
    const menuWidth = menuEl?.offsetWidth ?? MENU_MIN_WIDTH;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeTop =
      spaceBelow < menuHeight + MENU_GAP && spaceAbove > spaceBelow;

    let left = align === "end" ? rect.right : rect.left;
    if (align === "end") {
      left = Math.min(left, window.innerWidth - 8);
      left = Math.max(left, menuWidth + 8);
    } else {
      left = Math.max(8, Math.min(left, window.innerWidth - menuWidth - 8));
    }

    setCoords({
      top: placeTop ? rect.top - MENU_GAP : rect.bottom + MENU_GAP,
      left,
      placement: placeTop ? "top" : "bottom",
    });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
    // Re-measure after paint once menu height is known.
    const raf = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    // Capture scroll on any ancestor (table wrap, shell, window).
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const transform =
    coords == null
      ? undefined
      : coords.placement === "top"
        ? align === "end"
          ? "translate(-100%, -100%)"
          : "translateY(-100%)"
        : align === "end"
          ? "translateX(-100%)"
          : undefined;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        className="rounded px-1.5 py-0.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden className="text-base leading-none tracking-tighter">
          ⋯
        </span>
      </button>
      {open && coords
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                transform,
                zIndex: 200,
              }}
              className={
                menuClassName ??
                "min-w-[7.5rem] rounded-md border border-neutral-200 bg-white py-1 shadow-md"
              }
              onClick={(e) => {
                const el = e.target as HTMLElement;
                if (
                  el.closest(
                    "a, button[type='submit'], button:not([type]), [data-row-action]",
                  )
                ) {
                  setOpen(false);
                }
              }}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

/** Standard text action inside {@link RowActionsMenu}. */
export function RowActionItem({
  children,
  onClick,
  destructive,
  type = "button",
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  type?: "button" | "submit";
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "onClick" | "children" | "className"
>) {
  return (
    <button
      type={type}
      data-row-action
      role="menuitem"
      onClick={onClick}
      className={
        destructive
          ? "block w-full px-2.5 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
          : "block w-full px-2.5 py-1.5 text-left text-sm text-neutral-800 hover:bg-neutral-50"
      }
      {...rest}
    >
      {children}
    </button>
  );
}
