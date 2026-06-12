"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AuthPanel } from "@/components/AuthPanel";
import { BottomNav, SideNav } from "@/components/ResponsiveNav";
import { ComposerModal } from "@/components/modals/ComposerModal";
import { InstantModal } from "@/components/modals/InstantModal";
import { useAppState } from "@/state/AppState";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { backendLoading, isGuest } = useAppState();
  const guestLockedRoute =
    isGuest &&
    (pathname.startsWith("/messages") ||
      pathname.startsWith("/editor") ||
      pathname.startsWith("/settings"));
  const lockedTitle = pathname.startsWith("/messages")
    ? "Messages"
    : pathname.startsWith("/editor")
      ? "Editor"
      : "Settings";

  return (
    <>
      <SideNav />
      <main className="app-content">
        {backendLoading ? (
          <section className="empty-state app-loading-state">
            <h2>Loading Blip...</h2>
            <p>Getting your people, posts, and messages ready.</p>
          </section>
        ) : guestLockedRoute ? (
          <div className="screen">
            <AppHeader title={lockedTitle} brand />
            <AuthPanel />
            <section className="empty-state">
              <h2>{lockedTitle} unlocks when you join.</h2>
              <p>Create an account to use this part of Blip.</p>
            </section>
          </div>
        ) : (
          children
        )}
      </main>
      <BottomNav />
      <InstantModal />
      <ComposerModal />
    </>
  );
}
