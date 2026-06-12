"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface BlipReactionButtonProps {
  active: boolean;
  count: number;
  disabled?: boolean;
  compact?: boolean;
  color?: string;
  onClick: () => void;
}

export function BlipReactionButton({
  active,
  count,
  disabled = false,
  compact = false,
  color = "#f43f8f",
  onClick
}: BlipReactionButtonProps) {
  const [burstKey, setBurstKey] = useState(0);
  const clipId = useId();

  function handleClick() {
    if (disabled) {
      return;
    }

    setBurstKey((key) => key + 1);
    onClick();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label="Blip post"
      aria-pressed={active}
      className={`blip-reaction-button ${compact ? "blip-reaction-button-compact" : ""}`}
      style={{ color: active ? color : "#777777" }}
    >
      <span className="blip-motion-icon-wrap">
        <motion.svg
          width={compact ? 20 : 26}
          height={compact ? 20 : 26}
          viewBox="0 0 64 64"
          className="blip-motion-icon"
          whileTap={{ scale: 0.82 }}
          animate={
            active
              ? { scale: [1, 1.18, 0.94, 1.06, 1] }
              : { scale: 1 }
          }
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <defs>
            <clipPath id={clipId}>
              <circle cx="32" cy="32" r="21" />
            </clipPath>
            <linearGradient id={`${clipId}-shine`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.42" />
              <stop offset="0.46" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <motion.circle
            cx="44"
            cy="9"
            r="3.3"
            fill={color}
            initial={false}
            animate={
              active
                ? { opacity: [0.55, 1, 0.82], y: [-1, -3, -2], scale: [1, 1.22, 1] }
                : { opacity: 0.72, y: 0, scale: 1 }
            }
            transition={{ duration: 0.45 }}
          />
          <motion.circle
            cx="51"
            cy="3"
            r="2.5"
            fill={color}
            initial={false}
            animate={
              active
                ? { opacity: [0.35, 0.9, 0.62], y: [-1, -4, -2], scale: [0.88, 1.18, 1] }
                : { opacity: 0.55, y: 0, scale: 1 }
            }
            transition={{ duration: 0.5, delay: 0.03 }}
          />

          <motion.circle
            cx="32"
            cy="32"
            r="21"
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            animate={{
              strokeWidth: active ? [5, 7, 5] : 5
            }}
            transition={{ duration: 0.35 }}
          />

          <g clipPath={`url(#${clipId})`}>
            <motion.circle
              cx="32"
              cy="32"
              r="21"
              fill={color}
              initial={false}
              animate={
                active
                  ? { opacity: 1, scale: [0.15, 1.12, 0.96, 1] }
                  : { opacity: 0, scale: 0.15 }
              }
              transition={{ duration: 0.52, ease: [0.2, 0.9, 0.2, 1] }}
            />
          </g>

          <g clipPath={`url(#${clipId})`}>
            <motion.path
              d="M 8 68 C 20 56, 28 62, 38 54 C 48 46, 56 54, 68 44 L 68 68 Z"
              fill={color}
              initial={false}
              animate={
                active
                  ? {
                      y: [22, 2, -3, 0],
                      scaleY: [0.3, 1.12, 0.92, 1]
                    }
                : {
                      y: 42,
                      scaleY: 0.2
                    }
              }
              transition={{
                duration: 0.55,
                ease: [0.2, 0.9, 0.2, 1]
              }}
            />
            <motion.path
              d="M 0 20 C 14 28, 24 16, 36 24 C 48 32, 54 18, 68 24 L 68 0 L 0 0 Z"
              fill={`url(#${clipId}-shine)`}
              initial={false}
              animate={active ? { opacity: [0, 0.78, 0.28], y: [16, 2, 0] } : { opacity: 0, y: 18 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
          </g>

          <motion.circle
            cx="32"
            cy="32"
            r="7"
            fill={active ? "#ffffff" : "currentColor"}
            animate={active ? { scale: [1, 0.72, 1.28, 1] } : { scale: 1 }}
            transition={{ duration: 0.38 }}
          />
        </motion.svg>

        <AnimatePresence>
          {active ? (
            <motion.span
              key={burstKey}
              className="blip-motion-burst"
              initial={{ opacity: 1, scale: 0.4 }}
              animate={{ opacity: 0, scale: 1.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span style={{ background: color }} />
              <span style={{ background: color }} />
              <span style={{ background: color }} />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>

      <span>{compact ? count : `${count} blips`}</span>
    </button>
  );
}
