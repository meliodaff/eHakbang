import type { ReactNode } from "react";

/**
 * AI-generated step text occasionally embeds inline markdown citation links
 * (e.g. "([lawyer-philippines.com](https://...))") instead of plain prose.
 * This renders those as real links instead of showing the raw markdown/URL,
 * while leaving ordinary text untouched.
 */
const LINK_PATTERN =
  /\(?\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)\)?|(https?:\/\/[^\s)]+)/g;

export function linkifyText(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  for (const match of text.matchAll(LINK_PATTERN)) {
    const [full, mdLabel, mdUrl, bareUrl] = match;
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));

    const url = mdUrl ?? bareUrl;
    nodes.push(
      <a
        key={key++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        {mdLabel ?? url}
      </a>,
    );
    lastIndex = index + full.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

/** Removes inline markdown citation links entirely, e.g. for fields like estimated_time. */
export function stripInlineLinks(text: string): string {
  return text.replace(LINK_PATTERN, "").replace(/\s{2,}/g, " ").trim();
}
