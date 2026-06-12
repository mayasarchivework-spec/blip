import { Check } from "lucide-react";
import type { ReactNode } from "react";
import type { User } from "@/data/types";

interface VerifiedNameProps {
  user: Pick<User, "accountRole" | "displayName">;
  children?: ReactNode;
  className?: string;
}

export function VerifiedName({ children, className = "", user }: VerifiedNameProps) {
  const verified = user.accountRole === "owner" || user.accountRole === "admin";
  const label = user.accountRole === "owner" ? "Blip owner" : "Blip admin";

  return (
    <span className={`verified-name ${className}`}>
      <span>{children ?? user.displayName}</span>
      {verified ? (
        <span className="verified-check" title={label} aria-label={label}>
          <Check size={11} strokeWidth={4} />
        </span>
      ) : null}
    </span>
  );
}
