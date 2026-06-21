import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { PwaProvider } from "@/components/PwaProvider";
import { AppStateProvider } from "@/state/AppState";

export const metadata: Metadata = {
  title: "Blip",
  applicationName: "Blip",
  description: "A nostalgic friends-first social app for sharing moments.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Blip"
  },
  formatDetection: {
    telephone: false
  },
  icons: {
    icon: [
      { url: "/assets/pwa/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/pwa/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/assets/pwa/icon-192.png",
    apple: [{ url: "/assets/pwa/apple-touch-icon.png", sizes: "180x180" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#006cff"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaProvider>
          <AppStateProvider>
            <AppShell>{children}</AppShell>
          </AppStateProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
