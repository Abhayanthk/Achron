"use client";
import React, { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useDebouncedCallback } from "use-debounce";
import axios from "axios";
import { toast } from "sonner";
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
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    const { Excalidraw: ExcalidrawComponent, MainMenu, WelcomeScreen } = mod;
    return (props: any) => (
      <ExcalidrawComponent {...props}>
        <WelcomeScreen />
        <MainMenu>
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.SaveToActiveFile />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.Help />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ToggleTheme />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
      </ExcalidrawComponent>
    );
  },
  { ssr: false },
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

function getStoredLibrary(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("excalidraw-library");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function NoteExcalidrawWrapper({
  initialData,
  noteId,
  breadcrumbs = [],
}: NoteExcalidrawWrapperProps) {
  const [libraryItems] = useState<any[]>(getStoredLibrary);
  // Excalidraw gives us its imperative API via the excalidrawAPI prop callback
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  // Once the Excalidraw API is ready, check for a pending library import.
  // This covers two flows:
  //   1. Redirect landed here: /notes/[noteId]?addLibrary=<url>
  //   2. Redirect landed on /notes (graph page), which stores a pending URL in
  //      localStorage and the user then opens a note.
  useEffect(() => {
    if (!excalidrawAPI) return;

    const applyLibrary = async (libraryUrl: string) => {
      try {
        const res = await fetch(libraryUrl);
        const data = await res.json();
        const items: any[] = data.libraryItems ?? [];
        if (items.length === 0) {
          toast.error("Library appears to be empty");
          return;
        }
        await excalidrawAPI.updateLibrary({
          libraryItems: items,
          merge: true,
          openLibraryMenu: true,
        });
        toast.success(`Added ${items.length} item${items.length !== 1 ? "s" : ""} to your library`);
      } catch {
        toast.error("Failed to import library");
      }
    };

    // Flow 1 — URL param on this page
    const params = new URLSearchParams(window.location.search);
    const addLibraryUrl = params.get("addLibrary");
    if (addLibraryUrl) {
      applyLibrary(addLibraryUrl);
      // Clean up the URL param without triggering a navigation
      window.history.replaceState({}, "", `/notes/${noteId}`);
      return;
    }

    // Flow 2 — pending library stored by the graph page
    const pending = localStorage.getItem("excalidraw-pending-library");
    if (pending) {
      localStorage.removeItem("excalidraw-pending-library");
      applyLibrary(pending);
    }
  }, [excalidrawAPI, noteId]);

  const debouncedSave = useDebouncedCallback(
    async (elements, appState, files) => {
      try {
        await axios.patch(`/api/notes/${noteId}`, {
          content: {
            elements,
            appState: { ...appState, collaborators: [] },
            files,
          },
        });
      } catch (error) {
        console.error("Failed to save note:", error);
      }
    },
    1000,
  );

  const onChange = (elements: any, appState: any, files: any) => {
    debouncedSave(elements, appState, files);
  };

  const handleLibraryChange = useCallback((items: any[]) => {
    try {
      localStorage.setItem("excalidraw-library", JSON.stringify(items));
    } catch {}
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".excalidraw-container")) {
      e.stopPropagation();
    }
  }, []);

  return (
    <div
      style={{ height: "100vh", width: "100%", position: "relative" }}
      onPointerDownCapture={handlePointerDown}
    >
      {breadcrumbs.length > 0 && (
        <div className="absolute top-4 left-16 z-50 backdrop-blur-sm px-3 py-1.5 rounded-md">
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
        theme="dark"
        // Build the return URL explicitly from noteId so it's always correct
        // regardless of which page the component happens to mount on.
        libraryReturnUrl={
          typeof window !== "undefined"
            ? `${window.location.origin}/notes/${noteId}`
            : ""
        }
        excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
        initialData={{
          elements: initialData?.elements || [],
          appState: {
            ...initialData?.appState,
            theme: "dark",
            viewBackgroundColor:
              initialData?.appState?.viewBackgroundColor || "#09090b",
          },
          files: initialData?.files || {},
          libraryItems,
        }}
        onLibraryChange={handleLibraryChange}
        onChange={onChange}
      />
    </div>
  );
}
