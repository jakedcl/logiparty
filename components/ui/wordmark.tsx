import Link from "next/link";

/** Landing header wordmark. One mark for the site header and the demo. */
export function Wordmark({
  href = "/",
  anchor = false,
}: {
  href?: string;
  /** In-page hash (`#top`) instead of a route. */
  anchor?: boolean;
}) {
  if (anchor) {
    return (
      <a href={href} className="m-brand">
        Logiparty
      </a>
    );
  }
  return (
    <Link href={href} className="m-brand">
      Logiparty
    </Link>
  );
}
