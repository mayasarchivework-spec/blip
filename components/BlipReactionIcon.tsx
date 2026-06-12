interface BlipReactionIconProps {
  active?: boolean;
  size?: number;
}

export function BlipReactionIcon({ active = false, size = 22 }: BlipReactionIconProps) {
  return (
    <svg
      className={`blip-reaction-icon ${active ? "is-active" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="blip-reaction-clip">
          <circle cx="22" cy="25" r="15.5" />
        </clipPath>
      </defs>
      <circle className="blip-reaction-fill" cx="22" cy="25" r="15.5" />
      <g clipPath="url(#blip-reaction-clip)">
        <path
          className="blip-reaction-wave"
          d="M4 28c5.6-4.1 10.8-2.2 16.1.2 5.7 2.6 11.6 5.2 20.9-2.9V48H4z"
        />
      </g>
      <circle className="blip-reaction-ring" cx="22" cy="25" r="15.5" />
      <circle className="blip-reaction-dot" cx="22" cy="25" r="5" />
      <circle className="blip-reaction-bubble bubble-one" cx="32.5" cy="10.5" r="3" />
      <circle className="blip-reaction-bubble bubble-two" cx="39" cy="5" r="2.2" />
    </svg>
  );
}
