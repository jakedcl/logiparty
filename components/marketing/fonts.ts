import { Archivo_Black, IBM_Plex_Mono } from "next/font/google";

/** Display — oversized bay / brand type (scoped via CSS var on .marketing). */
export const marketingDisplay = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-m-display",
  display: "swap",
});

/** Mono — bay numbers, ticket labels. */
export const marketingMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-m-mono",
  display: "swap",
});

export const marketingFontVars = `${marketingDisplay.variable} ${marketingMono.variable}`;
