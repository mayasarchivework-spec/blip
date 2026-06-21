import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/home",
    name: "Blip",
    short_name: "Blip",
    description: "A nostalgic friends-first social app for sharing moments.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    background_color: "#f4f4f4",
    theme_color: "#006cff",
    lang: "en",
    categories: ["social", "photo", "lifestyle"],
    icons: [
      {
        src: "/assets/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/assets/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/assets/pwa/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "Home",
        short_name: "Home",
        url: "/home",
        icons: [{ src: "/assets/pwa/icon-192.png", sizes: "192x192" }]
      },
      {
        name: "Explore",
        short_name: "Explore",
        url: "/explore",
        icons: [{ src: "/assets/pwa/icon-192.png", sizes: "192x192" }]
      },
      {
        name: "Messages",
        short_name: "Messages",
        url: "/messages",
        icons: [{ src: "/assets/pwa/icon-192.png", sizes: "192x192" }]
      }
    ]
  };
}
