export function LogoMark({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <BlipIcon size={42} />;
  }

  return (
    <span className="wordmark" aria-label="Blip">
      <span className="wordmark-text">Blip</span>
    </span>
  );
}

export function BlipIcon({ size = 36 }: { size?: number }) {
  return (
    <span
      className="blip-icon"
      style={{ width: size, height: size, fontSize: size }}
      aria-hidden="true"
    >
      <span className="blip-icon-letter">B</span>
      <svg className="blip-icon-radio" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M7 25a10 10 0 0 1 10-10" />
        <path d="M7 18a17 17 0 0 1 17-17" />
      </svg>
      <span className="blip-icon-dot" />
    </span>
  );
}
