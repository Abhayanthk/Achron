/**
 * Utilities for working with BlockNote content.
 *
 * Existing data in the DB is plain‑text strings. New data is stored as
 * JSON‑stringified BlockNote Block[] arrays. These helpers let the app
 * handle both formats transparently.
 */

import type { Block } from "@blocknote/core";

/* ------------------------------------------------------------------ */
/*  Detection                                                          */
/* ------------------------------------------------------------------ */

/**
 * Returns `true` when `value` looks like serialised BlockNote JSON content
 * (an array whose first element has an `id` and `type` key).
 */
export function isBlockContent(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed.startsWith("[")) return false;
  try {
    const parsed = JSON.parse(trimmed);
    return (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      typeof parsed[0] === "object" &&
      "type" in parsed[0]
    );
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Plain‑text extraction (for previews & search)                      */
/* ------------------------------------------------------------------ */

/** Recursively extract text from a single inline‑content node. */
function inlineToText(node: any): string {
  if (typeof node === "string") return node;
  if (node?.type === "text") return node.text ?? "";
  if (node?.type === "link") {
    return (node.content ?? []).map(inlineToText).join("");
  }
  return "";
}

/** Recursively extract text from a Block tree. */
function blockToText(block: any): string {
  const parts: string[] = [];
  // inline content
  if (Array.isArray(block.content)) {
    parts.push(block.content.map(inlineToText).join(""));
  }
  // nested children
  if (Array.isArray(block.children)) {
    parts.push(...block.children.map(blockToText));
  }
  return parts.join("\n");
}

/**
 * Given a raw DB string (either legacy plain‑text or JSON blocks),
 * return a plain‑text representation suitable for previews / search.
 */
export function extractPlainText(value: string | null | undefined): string {
  if (!value) return "";
  if (!isBlockContent(value)) return value;
  try {
    const blocks: Block[] = JSON.parse(value);
    return blocks
      .map(blockToText)
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  } catch {
    return value;
  }
}

/* ------------------------------------------------------------------ */
/*  Parsing for BlockNote initialisation                               */
/* ------------------------------------------------------------------ */

/**
 * If `value` is already serialised blocks, parse and return them.
 * Otherwise return `undefined` — the caller should use
 * `editor.tryParseMarkdownToBlocks(value)` to convert at runtime.
 */
export function tryParseStoredBlocks(
  value: string | null | undefined,
): Block[] | undefined {
  if (!value || !isBlockContent(value)) return undefined;
  try {
    return JSON.parse(value) as Block[];
  } catch {
    return undefined;
  }
}
