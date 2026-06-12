"use client";

import type { CSSProperties } from "react";
import type { User } from "@/data/types";
import { useAppState } from "@/state/AppState";

interface AvatarRingProps {
  user: User;
  size?: "sm" | "md" | "lg" | "xl";
  showInstant?: boolean;
  showPlus?: boolean;
  onClick?: () => void;
}

export function AvatarRing({
  user,
  size = "md",
  showInstant = true,
  showPlus = false,
  onClick
}: AvatarRingProps) {
  const { accentOptions, getInstantForUser } = useAppState();
  const accent =
    accentOptions.find((option) => option.name === user.accentColor) ?? accentOptions[0];
  const hasInstant = Boolean(getInstantForUser(user.id));
  const ring = showInstant && hasInstant;
  const className = `avatar-ring avatar-${size} avatar-shape-${
    user.avatarShape ?? "circle"
  } ${ring ? "has-instant" : ""}`;
  const style = { "--ring-color": accent.color } as CSSProperties;
  const content = (
    <>
      <img src={user.avatarUrl} alt="" />
      {showPlus ? <span className="avatar-plus">+</span> : null}
    </>
  );

  if (!onClick) {
    return (
      <span className={className} style={style} aria-label={`${user.displayName} profile photo`}>
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={onClick}
      aria-label={`${user.displayName} profile photo`}
    >
      {content}
    </button>
  );
}
