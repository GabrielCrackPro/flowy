"use client";

import type { ReactNode } from "react";
import { escapeHighlight } from "./utils";

interface HighlightProps {
  text: string;
  query: string;
}

export function Highlight({ text, query }: HighlightProps) {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (terms.length < 2 && terms[0]?.length < 2) return <>{text}</>;

  try {
    // Highlight each search term independently, so multi-word queries
    // highlight every matching word instead of only the full phrase
    const regex = new RegExp(`(${terms.map(escapeHighlight).join("|")})`, "gi");
    const parts = text.split(regex);
    if (parts.length <= 1) return <>{text}</>;
    const nodes: ReactNode[] = [];
    let offset = 0;
    let isMatch = false;

    for (const part of parts) {
      const key = `${offset}-${part}`;
      nodes.push(
        isMatch ? (
          <mark
            key={key}
            className="rounded-sm bg-gradient-to-r from-primary/30 to-primary/20 text-foreground font-semibold dark:from-primary/40 dark:to-primary/30"
          >
            {part}
          </mark>
        ) : (
          <span key={key}>{part}</span>
        ),
      );
      offset += part.length;
      isMatch = !isMatch;
    }

    return <>{nodes}</>;
  } catch {
    return <>{text}</>;
  }
}
