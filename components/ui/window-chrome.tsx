import { createElement, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToolbarTag = "div" | "header" | "nav";

/** Light band under a blue title bar — landing window toolbar, portal, demo. */
export function WindowToolbar({
  as = "div",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLElement> & {
  as?: ToolbarTag;
  children: ReactNode;
}) {
  return createElement(
    as,
    { ...rest, className: cn("lp-window-head", className) },
    children
  );
}

/** Blue gloss title bar from the landing app window. */
export function WindowTitleBar({ title }: { title: string }) {
  return (
    <div className="m-window-bar">
      <div className="m-window-dots" aria-hidden>
        <span className="m-window-dot m-window-dot-close" />
        <span className="m-window-dot m-window-dot-min" />
        <span className="m-window-dot m-window-dot-max" />
      </div>
      <p className="m-window-title">{title}</p>
      <span className="m-window-bar-spacer" aria-hidden />
    </div>
  );
}
