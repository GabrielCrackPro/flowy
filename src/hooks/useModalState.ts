"use client";

import { useCallback } from "react";
import { useOverlayOpen } from "@/hooks/useOverlayOpen";

/**
 * Simple boolean open-state hook for modals and sheets. Delegates to
 * `useOverlayOpen` so every floating layer shares one controlled/uncontrolled
 * implementation (including native back-button dismissal).
 */
export function useModalState(initialOpen = false) {
  const { open: isOpen, onOpenChange: setIsOpen } = useOverlayOpen<undefined>({
    defaultOpen: initialOpen,
  });

  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const toggle = useCallback(() => setIsOpen(!isOpen), [setIsOpen, isOpen]);

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle,
  };
}
