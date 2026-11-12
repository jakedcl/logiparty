import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogipartyMark } from "@/components/brand/logiparty-mark";

type Props = {
  href?: string;
  anchor?: boolean;
  className?: string;
  /** Show wordmark text beside the mark. */
  showWordmark?: boolean;
  markSize?: number;
};

/** Apex marketing wordmark — mark + "Logiparty" */
export function LogipartyLogo({
  href = "/",
  anchor = false,
  className,
  showWordmark = true,
  markSize = 28,
}: Props) {
  const inner = (
  <>
    <LogipartyMark size={markSize} className="text-[var(--m-accent,#0B5CAB)]" />
    {showWordmark ? (
      <span className="text-[1.0625rem] font-bold tracking-tight text-[var(--m-fg)]">
        Logiparty
      </span>
    ) : null}
  </>
  );

  const classes = cn(
    "inline-flex items-center gap-2.5 no-underline hover:no-underline",
    className
  );

  if (anchor) {
    return (
      <a href={href} className={classes}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  );
}
