"use client";

import type { ReactNode } from "react";
import { LogoMark } from "@/components/LogoMark";

interface AppHeaderProps {
  title: string;
  brand?: boolean;
  center?: ReactNode;
  left?: ReactNode;
  actions?: ReactNode;
}

export function AppHeader({ title, brand = false, center, left, actions }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-left">
        {left}
        {brand ? (
          <>
            <LogoMark />
            <h1 className="desktop-header-title">{title}</h1>
          </>
        ) : (
          <h1>{title}</h1>
        )}
      </div>
      {center ? <div className="header-center">{center}</div> : null}
      {actions ? <div className="header-actions">{actions}</div> : null}
    </header>
  );
}
