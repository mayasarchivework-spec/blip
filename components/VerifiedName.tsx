import { Check } from "lucide-react";
import type { ReactNode } from "react";
import type { User } from "@/data/types";

interface VerifiedNameProps {
  user: Pick<User, "accountRole" | "displayName">;
  children?: ReactNode;
  className?: string;
}

function stripFakeVerificationMark(value: ReactNode) {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/[✓✔☑✅]/g, "").replace(/\s+/g, " ").trim() || value;
}

export function VerifiedName({ children, className = "", user }: VerifiedNameProps) {
  const verified = user.accountRole === "owner" || user.accountRole === "admin";
  const label = user.accountRole === "owner" ? "Blip owner" : "Blip admin";
  const name = stripFakeVerificationMark(children ?? user.displayName);

  return (
    <span className={`verified-name ${className}`}>
      <span>{name}</span>
      {verified ? (
        <span className="verified-check" title={label} aria-label={label}>
          <Check size={12} strokeWidth={4} />
        </span>
      ) : null}
    </span>
  );
}
