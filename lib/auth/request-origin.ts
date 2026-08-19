/** Origin (scheme + host) for the current request — preserves tenant subdomain. */
export function getRequestOrigin(headersList: Headers): string {
  const host =
    headersList.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    headersList.get("host") ??
    "localhost:3000";
  const hostname = host.split(":")[0];
  const proto =
    headersList.get("x-forwarded-proto") ??
    (hostname === "localhost" || hostname === "127.0.0.1" ? "http" : "https");
  return `${proto}://${host}`;
}
