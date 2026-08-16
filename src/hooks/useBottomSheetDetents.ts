"use client";

import { useMemo, useRef, useState } from "react";

/** Allow a little rubber-band overshoot beyond the tallest detent. */
const OVERSCROLL = 0.06;

interface UseBottomSheetDetentsOptions {
  /** Ascending viewport-height fractions (0..1), e.g. [0.4, 0.9]. */
  detents: number[];
  /** Detent to open on (defaults to the smallest, so the sheet can be pulled up). */
  defaultIndex?: number;
  onDismiss: () => void;
  /** Fraction of the viewport to drag down before dismissing (default 0.18). */
  dismissThreshold?: number;
}

export interface BottomSheetDetents {
  activeIndex: number;
  /** Live height fraction while dragging; equals the target when idle. */
  heightFraction: number;
  /** The snapped height fraction for the current detent. */
  targetHeightFraction: number;
  /** Downward drag translation in px (only non-zero while pulled below the smallest detent). */
  dragY: number;
  isDragging: boolean;
  swipeHandlers: {
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  };
}

/**
 * Multi-snap drag behavior for bottom sheets. Drag the handle up to expand to
 * the next detent, down to collapse, and further down (past the smallest
 * detent) to dismiss. Uses live refs so the pointer-up handler always reads the
 * latest drag position instead of a stale closure.
 */
export function useBottomSheetDetents({
  detents,
  defaultIndex,
  onDismiss,
  dismissThreshold = 0.18,
}: UseBottomSheetDetentsOptions): BottomSheetDetents {
  const sorted = useMemo(() => [...detents].sort((a, b) => a - b), [detents]);

  const initialIndex =
    defaultIndex !== undefined
      ? Math.min(Math.max(defaultIndex, 0), sorted.length - 1)
      : 0;

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [heightFraction, setHeightFraction] = useState(sorted[initialIndex]);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const heightFractionRef = useRef(sorted[initialIndex]);
  const dragYRef = useRef(0);
  const startYRef = useRef<number | null>(null);
  const startHeightRef = useRef(sorted[initialIndex]);
  const viewportRef = useRef(0);

  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const updateHeight = (value: number) => {
    heightFractionRef.current = value;
    setHeightFraction(value);
  };

  const updateDrag = (value: number) => {
    dragYRef.current = value;
    setDragY(value);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse") return;
    viewportRef.current = window.innerHeight;
    startYRef.current = event.clientY;
    startHeightRef.current = sorted[activeIndex];
    updateDrag(0);
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (startYRef.current === null) return;
    const viewport = viewportRef.current || window.innerHeight;
    const delta = (event.clientY - startYRef.current) / viewport;
    const next = startHeightRef.current - delta;

    if (next < min) {
      // Pulled below the smallest detent: translate the whole sheet down.
      updateHeight(min);
      updateDrag((min - next) * viewport);
    } else {
      updateHeight(Math.min(max + OVERSCROLL, next));
      updateDrag(0);
    }
  };

  const finish = (event?: React.PointerEvent<HTMLDivElement>) => {
    if (startYRef.current === null) return;
    if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    startYRef.current = null;
    setIsDragging(false);

    const viewport = viewportRef.current || window.innerHeight;

    if (dragYRef.current / viewport >= dismissThreshold) {
      updateDrag(0);
      updateHeight(min);
      setActiveIndex(0);
      onDismiss();
      return;
    }

    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    for (let i = 0; i < sorted.length; i += 1) {
      const distance = Math.abs(sorted[i] - heightFractionRef.current);
      if (distance < best) {
        best = distance;
        nearest = i;
      }
    }

    setActiveIndex(nearest);
    updateHeight(sorted[nearest]);
    updateDrag(0);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) =>
    finish(event);
  const onPointerCancel = (event: React.PointerEvent<HTMLDivElement>) =>
    finish(event);

  return {
    activeIndex,
    heightFraction,
    targetHeightFraction: sorted[Math.min(activeIndex, sorted.length - 1)],
    dragY,
    isDragging,
    swipeHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
