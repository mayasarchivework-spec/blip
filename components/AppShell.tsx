"use client";

import type { ReactNode } from "react";
import { BottomNav, SideNav } from "@/components/ResponsiveNav";
import { ComposerModal } from "@/components/modals/ComposerModal";
import { InstantModal } from "@/components/modals/InstantModal";
import { useAppState } from "@/state/AppState";

export function AppShell({ children }: { children: ReactNode }) {
  const { backendLoading } = useAppState();

  return (
    <>
      <SideNav />
      <main className="app-content">
        {backendLoading ? (
          <section className="empty-state app-loading-state">
            <h2>Loading Blip...</h2>
            <p>Getting your people, posts, and messages ready.</p>
          </section>
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
