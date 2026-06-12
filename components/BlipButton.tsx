import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface BlipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  wide?: boolean;
}

export function BlipButton({
  children,
  variant = "primary",
  wide = false,
  className = "",
  ...props
}: BlipButtonProps) {
  return (
    <button
      className={`blip-button blip-button-${variant} ${wide ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
