import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogipartyArtwork } from "@/components/brand/logiparty-artwork";

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
  const inner = <LogipartyArtwork height={markSize} wordmark={showWordmark} decorative />;

  const classes = cn(
    "inline-flex items-center gap-2.5 no-underline hover:no-underline",
    className
  );

  if (anchor) {
    return (
      <a href={href} className={classes} aria-label="Logiparty home">
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} aria-label="Logiparty home">
      {inner}
    </Link>
  );
}
