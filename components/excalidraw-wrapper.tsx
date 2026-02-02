"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useDebouncedCallback } from "use-debounce";
import axios from "axios";
import { toast } from "sonner";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);

interface ExcalidrawWrapperProps {
  initialData: any;
  brainstormId: string;
}

export default function ExcalidrawWrapper({
  initialData,
  brainstormId,
}: ExcalidrawWrapperProps) {
  const debouncedSave = useDebouncedCallback(async (elements, appState) => {
    try {
      await axios.put(`/api/brainstorm/${brainstormId}`, {
        content: {
          elements,
          appState: {
            ...appState,
            collaborators: [],
          },
        },
      });
    } catch (error) {
      console.error("Failed to save:", error);
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
