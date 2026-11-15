import { cn } from "@/lib/utils";
import { LogipartyArtwork } from "./logiparty-artwork";

/** Compact Logiparty mark — readable at 16px. */
export function LogipartyMark({
  className,
  size = 24,
  title = "Logiparty",
}: {
  className?: string;
  size?: number;
  title?: string;
}) {
  return (
    <LogipartyArtwork
      height={size}
      className={cn("shrink-0", className)}
      title={title}
    />
  );
}
