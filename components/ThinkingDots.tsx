interface ThinkingDotsProps {
  compact?: boolean;
}

export function ThinkingDots({ compact = false }: ThinkingDotsProps) {
  return (
    <span
      className={`thinking-dots ${compact ? "thinking-dots-compact" : ""}`}
      aria-hidden="true"
    >
      <i />
      <i />
      <i />
    </span>
  );
}
