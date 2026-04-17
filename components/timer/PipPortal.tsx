"use client";

import { createPortal } from "react-dom";

interface PipPortalProps {
  pipWindow: Window | null;
  children: React.ReactNode;
}

export function PipPortal({ pipWindow, children }: PipPortalProps) {
  if (!pipWindow) return null;
  return createPortal(children, pipWindow.document.body);
}
