import { cn } from "@/lib/utils";

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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <rect width="24" height="24" rx="5" fill="#0B5CAB" />
      <path fill="#fff" d="M7 6.5h3.25v11H7V6.5Zm3.25 7.75H17V17h-6.75v-2.75Z" />
    </svg>
  );
}
