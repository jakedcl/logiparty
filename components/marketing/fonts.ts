import { PT_Sans } from "next/font/google";

/** Loaded on `.marketing` / `.demo-app` roots only — not the ops dashboard. */
export const marketingFont = PT_Sans({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-marketing",
  display: "swap",
});
