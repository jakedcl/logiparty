"use client";

import { Button } from "@/components/ui/button";

export function PrintButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className={className ?? "no-print"}
    >
      Print run sheet
    </Button>
  );
}
