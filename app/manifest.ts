import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Logiparty",
    short_name: "Logiparty",
    description:
      "Run sheets, inventory locks, fleet, crew, and a white-label client portal for event-logistics 3PLs.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F5F7",
    theme_color: "#0B5CAB",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
