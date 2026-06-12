"use client";

import { Camera, FileText, Video } from "lucide-react";
import { useAppState } from "@/state/AppState";
import type { ComposerType } from "@/data/types";

const createOptions: Array<{
  type: Exclude<ComposerType, "song" | null>;
  label: string;
  icon: typeof Camera;
}> = [
  { type: "photo", label: "Photo", icon: Camera },
  { type: "text", label: "Text", icon: FileText },
  { type: "video", label: "Video", icon: Video }
];

export function CreatePostPanel() {
  const { openComposer } = useAppState();

  return (
    <section className="create-panel">
      <div className="section-heading">
        <h2>Create post</h2>
        <span>only visible to you</span>
      </div>
      <div className="create-options">
        {createOptions.map(({ type, label, icon: Icon }) => (
          <button key={type} type="button" onClick={() => openComposer(type)}>
            <Icon size={28} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
