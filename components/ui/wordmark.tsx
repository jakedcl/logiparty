import { LogipartyLogo } from "@/components/brand/logiparty-logo";

/** Landing header wordmark. One mark for the site header and the demo. */
export function Wordmark({
  href = "/",
  anchor = false,
}: {
  href?: string;
  /** In-page hash (`#top`) instead of a route. */
  anchor?: boolean;
}) {
  return <LogipartyLogo href={href} anchor={anchor} className="m-brand-lockup" />;
}
