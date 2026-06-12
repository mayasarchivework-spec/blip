export function TextPost({
  content,
  compact = false
}: {
  content: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "text-post text-post-compact" : "text-post"}>
      <pre>{content}</pre>
      <span className="text-post-heart">♡</span>
    </div>
  );
}
