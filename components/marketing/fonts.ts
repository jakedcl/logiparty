import { PT_Sans } from "next/font/google";

/**
 * PT Sans for the whole product (root layout) and the landing page.
 * Only 400 and 700 are real cuts — don't ask the browser to fake 500/600.
 */
export const marketingFont = PT_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-marketing",
  display: "swap",
});
