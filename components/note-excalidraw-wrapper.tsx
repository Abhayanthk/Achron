"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useDebouncedCallback } from "use-debounce";
import axios from "axios";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);

interface NoteExcalidrawWrapperProps {
  initialData: any;
  noteId: string;
}

export default function NoteExcalidrawWrapper({
  initialData,
  noteId,
}: NoteExcalidrawWrapperProps) {
  const debouncedSave = useDebouncedCallback(async (elements, appState) => {
    try {
      await axios.patch(`/api/notes/${noteId}`, {
        content: {
          elements,
          appState: {
            ...appState,
            collaborators: [], // clean up unused session data
          },
        },
      });
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  }, 1000);

  const onChange = (elements: any, appState: any, files: any) => {
    debouncedSave(elements, appState);
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <Excalidraw
        initialData={{
          elements: initialData?.elements || [],
          appState: {
            ...initialData?.appState,
            viewBackgroundColor:
              initialData?.appState?.viewBackgroundColor || "#ffffff",
          },
        }}
        onChange={onChange}
      />
    </div>
  );
}
