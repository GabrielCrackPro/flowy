"use client";

import { useCallback, useRef, useState } from "react";

interface UseBottomSheetSwipeOptions {
  onDismiss: () => void;
  threshold?: number;
}

export function useBottomSheetSwipe({
  onDismiss,
  threshold = 72,
}: UseBottomSheetSwipeOptions) {
  const [offset, setOffset] = useState(0);
  const startYRef = useRef<number | null>(null);
  const offsetRef = useRef(0);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse") return;
      startYRef.current = event.clientY;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (startYRef.current === null) return;
      const nextOffset = Math.max(0, event.clientY - startYRef.current);
      offsetRef.current = nextOffset;
      setOffset(nextOffset);
    },
    [],
  );

  const finish = useCallback(
    (event?: React.PointerEvent<HTMLDivElement>) => {
      if (startYRef.current === null) return;
      const shouldDismiss = offsetRef.current >= threshold;
      startYRef.current = null;
      if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      offsetRef.current = 0;
      setOffset(0);
      if (shouldDismiss) onDismiss();
    },
    [onDismiss, threshold],
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => finish(event),
    [finish],
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => finish(event),
    [finish],
  );

  return {
    offset,
    swipeHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
  };
}
