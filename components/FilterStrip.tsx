"use client";

import { Heart } from "lucide-react";
import { useAppState } from "@/state/AppState";

const filters = [
  "Original",
  "Noir",
  "Cine 400",
  "Bleach Bypass",
  "Moody",
  "Faded",
  "Cold Blue"
];

export function FilterStrip() {
  const { editorFilter, setEditorFilter } = useAppState();

  return (
    <div className="filter-strip">
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          className={editorFilter === filter ? "active" : ""}
          onClick={() => setEditorFilter(filter)}
        >
          <img src="/assets/filter-thumb.svg" alt="" />
          {editorFilter === filter ? (
            <span className="filter-heart">
              <Heart size={16} fill="currentColor" />
            </span>
          ) : null}
          <span>{filter}</span>
        </button>
      ))}
    </div>
  );
}
