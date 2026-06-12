import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export function SettingsCard({ children }: { children: ReactNode }) {
  return <section className="settings-card">{children}</section>;
}

export function SettingsRow({
  title,
  value,
  note,
  danger = false,
  onClick
}: {
  title: string;
  value?: string;
  note?: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  const className = `${danger ? "settings-row danger-row" : "settings-row"}${
    onClick ? " settings-row-button" : ""
  }`;
  const content = (
    <>
      <div>
        <strong>{title}</strong>
        {note ? <span>{note}</span> : null}
      </div>
      <div className="settings-row-value">
        {value ? <span>{value}</span> : null}
        <ChevronRight size={28} />
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

export function ToggleSwitch({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      className={checked ? "toggle-switch on" : "toggle-switch"}
      onClick={onChange}
      aria-pressed={checked}
    >
      <span />
    </button>
  );
}
