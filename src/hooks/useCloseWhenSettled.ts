"use client";

import { useEffect, useRef } from "react";

/**
 * Closes a confirm dialog once a mutation the dialog started has settled.
 *
 * The dialog keeps itself open (via `ConfirmDialog`'s `loading` prop) while
 * the action is in flight; this hook fires `onSettled` on the first render
 * where `pending` returns to false after having been true — i.e. success or
 * error, both of which the caller's toast reports. A ref guards against the
 * dialog closing before the mutation actually started (the render where the
 * mutation is created but `pending` is still false).
 */
export function useCloseWhenSettled(
  pending: boolean,
  onSettled: () => void,
): () => void {
  const startedRef = useRef(false);

  const markStarted = () => {
    startedRef.current = true;
  };

  useEffect(() => {
    if (startedRef.current && !pending) {
      startedRef.current = false;
      onSettled();
    }
  }, [pending, onSettled]);

  return markStarted;
}
