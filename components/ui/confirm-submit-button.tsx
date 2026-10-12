"use client";

import type { MouseEvent, ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * Submit button that asks for native confirm before posting the form.
 * Pass `variant` to use the shared Button. Text-link call sites keep a plain button.
 */
export function ConfirmSubmitButton({
  children,
  message,
  className,
  variant,
  size,
}: {
  children: ReactNode;
  message: string;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  function confirmFirst(e: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(message)) e.preventDefault();
  }

  if (variant) {
    return (
      <Button
        type="submit"
        variant={variant}
        size={size}
        className={className}
        onClick={confirmFirst}
      >
        {children}
      </Button>
    );
  }

  return (
    <button type="submit" className={className} onClick={confirmFirst}>
      {children}
    </button>
  );
}
