import type { ReactNode } from "react";

/** Early Mac / iOS-era window chrome for marketing mocks. */
export function AppWindow({
  title,
  toolbar,
  children,
  className = "",
}: {
  title: string;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`m-window ${className}`.trim()}>
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
    </div>
  );
}
