"use client";

import React, { useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import {
  useCreateBlockNote,
  type BlockNoteViewProps,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

import { tryParseStoredBlocks } from "@/lib/block-utils";
import type {
  Block,
  BlockSchema,
  InlineContentSchema,
  StyleSchema,
} from "@blocknote/core";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BlockEditorProps {
  /** Raw DB value — plain-text string or JSON-stringified blocks. */
  initialContent?: string | null;
  /** Called whenever the document changes. Receives the JSON blocks. */
  onChange?: (blocks: Block[]) => void;
  /** If true the editor is read-only. */
  editable?: boolean;
  /** CSS class applied to the wrapper div. */
  className?: string;
  /** Additional props forwarded to BlockNoteView. */
  viewProps?: Partial<BlockNoteViewProps<any, any, any>>;
}

export interface BlockEditorHandle {
  /** Returns the current document as a JSON block array. */
  getDocument: () => Block[];
  /** Returns a JSON string of the current document. */
  getJSON: () => string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A reusable BlockNote wrapper that handles:
 * - legacy plain-text ↔ block conversion on mount
 * - change callbacks
 * - read-only mode
 * - dark theme (inherits from project)
 */
export const BlockEditor = forwardRef<BlockEditorHandle, BlockEditorProps>(
  function BlockEditor(
    { initialContent, onChange, editable = true, className, viewProps },
    ref,
  ) {
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Parse stored blocks if the value is already JSON blocks.
    const storedBlocks = useMemo(
      () => tryParseStoredBlocks(initialContent),
      [initialContent],
    );

    const editor = useCreateBlockNote({
      initialContent: storedBlocks ?? undefined,
    });

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        getDocument: () => editor.document as unknown as Block[],
        getJSON: () => JSON.stringify(editor.document),
      }),
      [editor],
    );

    // When the component mounts with legacy plain-text, convert it into blocks.
    const didConvert = useRef(false);
    useEffect(() => {
      if (didConvert.current) return;
      if (!initialContent || storedBlocks) return;

      didConvert.current = true;

      // Use tryParseMarkdownToBlocks to convert legacy plain text
      (async () => {
        try {
          const blocks = await editor.tryParseMarkdownToBlocks(initialContent);
          if (blocks && blocks.length > 0) {
            editor.replaceBlocks(editor.document, blocks);
          }
        } catch {
          // If markdown parsing fails, try wrapping as a simple paragraph
          try {
            const htmlBlocks = await editor.tryParseHTMLToBlocks(
              `<p>${initialContent.replace(/\n/g, "<br>")}</p>`,
            );
            if (htmlBlocks && htmlBlocks.length > 0) {
              editor.replaceBlocks(editor.document, htmlBlocks);
            }
          } catch {
            // Silently fall back to empty editor
          }
        }
      })();
    }, [initialContent, storedBlocks, editor]);

    // Propagate changes
    const handleChange = React.useCallback(() => {
      onChangeRef.current?.(editor.document as unknown as Block[]);
    }, [editor]);

    return (
      <div className={className} data-blocknote-wrapper="">
        <BlockNoteView
          editor={editor}
          editable={editable}
          onChange={handleChange}
          theme="dark"
          {...viewProps}
        />
      </div>
    );
  },
);
