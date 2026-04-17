"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export function usePipWindow() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const pipWindowRef = useRef<Window | null>(null);

  const isSupported =
    typeof window !== "undefined" &&
    "documentPictureInPicture" in window;

  const copyStyles = useCallback((pipWin: Window) => {
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const rules = Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
        const style = pipWin.document.createElement("style");
        style.textContent = rules;
        pipWin.document.head.appendChild(style);
      } catch {
        // Cross-origin sheet — clone the <link> element
        if (sheet.href) {
          const link = pipWin.document.createElement("link");
          link.rel = "stylesheet";
          link.href = sheet.href;
          pipWin.document.head.appendChild(link);
        }
      }
    }
  }, []);

  const openPip = useCallback(async () => {
    if (!isSupported) return;

    if (pipWindowRef.current) {
      pipWindowRef.current.close();
    }

    // @ts-ignore — Document Picture-in-Picture API not in standard DOM lib types
    const pip: Window = await window.documentPictureInPicture.requestWindow({
      width: 180,
      height: 72,
      disallowReturnToOpener: false,
    });

    copyStyles(pip);

    pip.document.body.style.margin = "0";
    pip.document.body.style.padding = "0";
    pip.document.body.style.backgroundColor = "#000000";
    pip.document.body.style.overflow = "hidden";
    pip.document.title = "Timer";

    pip.addEventListener("pagehide", () => {
      setPipWindow(null);
      pipWindowRef.current = null;
    });

    pipWindowRef.current = pip;
    setPipWindow(pip);
  }, [isSupported, copyStyles]);

  const closePip = useCallback(() => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
      setPipWindow(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
      }
    };
  }, []);

  return { pipWindow, openPip, closePip, isSupported };
}
