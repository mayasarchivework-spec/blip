"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

interface RichTextProps {
  text: string;
  className?: string;
}

const tokenPattern = /([@#][a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)/g;

function stopParentClick(event: MouseEvent<HTMLAnchorElement>) {
  event.stopPropagation();
}

export function RichText({ text, className = "" }: RichTextProps) {
  const parts = text.split(tokenPattern).filter((part) => part.length > 0);

  return (
    <span className={`rich-text ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith("@") && part.length > 1) {
          const username = part.slice(1);
          return (
            <Link
              href={`/profile/${username}`}
              key={`${part}-${index}`}
              onClick={stopParentClick}
            >
              {part}
            </Link>
          );
        }

        if (part.startsWith("#") && part.length > 1) {
          const tag = part.slice(1);
          return (
            <Link
              href={`/explore?tag=${encodeURIComponent(tag)}`}
              key={`${part}-${index}`}
              onClick={stopParentClick}
            >
              {part}
            </Link>
          );
        }

        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </span>
  );
}
