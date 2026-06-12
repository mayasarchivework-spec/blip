"use client";

import type { EditorAdjustment } from "@/data/types";
import { useAppState } from "@/state/AppState";

interface EditorSliderProps {
  name: EditorAdjustment;
  label: string;
  icon: React.ReactNode;
  min?: number;
  max?: number;
}

export function EditorSlider({
  name,
  label,
  icon,
  min = -40,
  max = 40
}: EditorSliderProps) {
  const { editorAdjustments, setEditorAdjustment } = useAppState();
  const value = editorAdjustments[name];

  return (
    <label className="editor-slider">
      <span className="slider-icon">{icon}</span>
      <span className="slider-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => setEditorAdjustment(name, Number(event.target.value))}
      />
      <input
        className="editor-value"
        type="number"
        min={min}
        max={max}
        value={value}
        aria-label={`${label} value`}
        onChange={(event) => setEditorAdjustment(name, Number(event.target.value))}
      />
    </label>
  );
}
