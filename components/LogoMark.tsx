export function LogoMark({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return <BlipIcon size={42} />;
  }

  return (
    <span className="wordmark" aria-label="Blip">
      <span className="wordmark-text">Blip</span>
      <img className="brand-wordmark-img" src="/assets/blip-wordmark.png" alt="" />
    </span>
  );
}

export function BlipIcon({ size = 36 }: { size?: number }) {
  return (
    <span
      className="blip-icon"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img src="/assets/blip-brand-icon.png" alt="" />
    </span>
  );
}
