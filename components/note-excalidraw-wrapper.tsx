"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useDebouncedCallback } from "use-debounce";
import axios from "axios";
import "@excalidraw/excalidraw/index.css";
import {
  Breadcrumb,
  BreadcrumbItem as ShadcnBreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NoteExcalidrawWrapperProps {
  initialData: any;
  noteId: string;
  breadcrumbs?: BreadcrumbItem[];
}

export default function NoteExcalidrawWrapper({
  initialData,
  noteId,
  breadcrumbs = [],
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
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      {breadcrumbs.length > 0 && (
        <div className="absolute top-4 left-16 z-50  backdrop-blur-sm px-3 py-1.5 rounded-md ">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  <ShadcnBreadcrumbItem>
                    {item.href ? (
                      <BreadcrumbLink
                        className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
                        href={item.href}
                      >
                        {item.icon && <item.icon className="size-4" />}
                        {item.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-white font-medium inline-flex items-center gap-1.5">
                        {item.icon && <item.icon className="size-4" />}
                        {item.label}
                      </BreadcrumbPage>
                    )}
                  </ShadcnBreadcrumbItem>
                  {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}
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
