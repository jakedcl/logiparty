import { IBM_Plex_Sans } from "next/font/google";

/**
 * IBM Plex Sans for marketing + app shell (root layout).
 * Only 400 and 600 are real cuts — don't ask the browser to fake 500/700.
 */
export const marketingFont = IBM_Plex_Sans({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-marketing",
  display: "swap",
});
