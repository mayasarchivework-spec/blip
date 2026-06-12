import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { AppStateProvider } from "@/state/AppState";

export const metadata: Metadata = {
  title: "Blip",
  description: "A nostalgic friends-first social app prototype.",
  icons: {
    icon: "/assets/blip-brand-icon.png",
    shortcut: "/assets/blip-brand-icon.png",
    apple: "/assets/blip-brand-icon.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppStateProvider>
          <AppShell>{children}</AppShell>
        </AppStateProvider>
      </body>
    </html>
  );
}
