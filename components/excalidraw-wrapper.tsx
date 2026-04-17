"use client";
import React, { useState, useCallback } from "react";
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
  async () => {
    const mod = await import("@excalidraw/excalidraw");
    const {
      Excalidraw: ExcalidrawComponent,
      MainMenu,
      WelcomeScreen,
    } = mod;
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

interface ExcalidrawWrapperProps {
  initialData: any;
  brainstormId: string;
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

export default function ExcalidrawWrapper({
  initialData,
  brainstormId,
  breadcrumbs = [],
}: ExcalidrawWrapperProps) {
  const [libraryItems] = useState<any[]>(getStoredLibrary);

  const debouncedSave = useDebouncedCallback(
    async (elements, appState, files) => {
      try {
        await axios.put(`/api/brainstorm/${brainstormId}`, {
          content: {
            elements,
            appState: { ...appState, collaborators: [] },
            files,
          },
        });
      } catch (error) {
        console.error("Failed to save:", error);
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
        <div className="absolute top-4 left-16 z-50 bg-zinc-950/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/10">
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
        libraryReturnUrl={
          typeof window !== "undefined" ? window.location.href : ""
        }
        onLibraryChange={handleLibraryChange}
        onChange={onChange}
      />
    </div>
  );
}
