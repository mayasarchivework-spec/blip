import { RichText } from "@/components/RichText";

export function TextPost({
  content,
  compact = false
}: {
  content: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "text-post text-post-compact" : "text-post"}>
      <p className="text-post-copy">
        <RichText text={content} />
      </p>
      <span className="text-post-footer">posted from Blip text</span>
    </div>
  );
}
