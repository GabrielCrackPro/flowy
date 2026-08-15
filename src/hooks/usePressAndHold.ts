"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UsePressAndHoldOptions {
  onTap: () => void;
  onLongPress: () => void;
  duration?: number;
}

export interface PressAndHoldHandlers {
  onPointerDown: React.PointerEventHandler<HTMLElement>;
  onPointerUp: React.PointerEventHandler<HTMLElement>;
  onPointerCancel: React.PointerEventHandler<HTMLElement>;
  onContextMenu: React.MouseEventHandler<HTMLElement>;
  onClick: React.MouseEventHandler<HTMLElement>;
}

/**
 * Separates a normal tap from a press-and-hold gesture.
 *
 * Pointer activation is handled on pointerup so a trigger's native click
 * behavior cannot accidentally run alongside the long-press action. Keyboard
 * activation continues through click and is treated as a normal tap.
 */
export function usePressAndHold({
  onTap,
  onLongPress,
  duration = 550,
}: UsePressAndHoldOptions): {
  isPressing: boolean;
  pressHandlers: PressAndHoldHandlers;
} {
  const timerRef = useRef<number | null>(null);
  const longPressedRef = useRef(false);
  const pointerHandledRef = useRef(false);
  const [isPressing, setIsPressing] = useState(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releasePointer = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture?.(event.pointerId);
      }
    },
    [],
  );

  const onPointerDown = useCallback<React.PointerEventHandler<HTMLElement>>(
    (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();
      event.currentTarget.focus();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      clearTimer();
      longPressedRef.current = false;
      pointerHandledRef.current = false;
      setIsPressing(true);

      timerRef.current = window.setTimeout(() => {
        longPressedRef.current = true;
        setIsPressing(false);
        onLongPress();
      }, duration);
    },
    [clearTimer, duration, onLongPress],
  );

  const onPointerUp = useCallback<React.PointerEventHandler<HTMLElement>>(
    (event) => {
      releasePointer(event);
      clearTimer();
      setIsPressing(false);
      pointerHandledRef.current = true;

      if (longPressedRef.current) {
        longPressedRef.current = false;
        return;
      }

      onTap();
    },
    [clearTimer, onTap, releasePointer],
  );

  const onPointerCancel = useCallback<React.PointerEventHandler<HTMLElement>>(
    (event) => {
      releasePointer(event);
      clearTimer();
      longPressedRef.current = false;
      pointerHandledRef.current = true;
      setIsPressing(false);
    },
    [clearTimer, releasePointer],
  );

  const onClick = useCallback<React.MouseEventHandler<HTMLElement>>(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (pointerHandledRef.current) {
        pointerHandledRef.current = false;
        return;
      }

      onTap();
    },
    [onTap],
  );

  const onContextMenu = useCallback<React.MouseEventHandler<HTMLElement>>(
    (event) => event.preventDefault(),
    [],
  );

  useEffect(() => clearTimer, [clearTimer]);

  return {
    isPressing,
    pressHandlers: {
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onContextMenu,
      onClick,
    },
  };
}
