import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Perkakas",
    short_name: "Perkakas",
    description: "Small everyday tools in one place: QR code, Pomodoro, JSON formatter, background remover and more.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0A0A0A",
    theme_color: "#0A0A0A",
    categories: ["utilities", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Pomodoro", url: "/pomodoro", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "JSON Formatter", url: "/json-formatter", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "QR Code", url: "/qr-code-generator", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
