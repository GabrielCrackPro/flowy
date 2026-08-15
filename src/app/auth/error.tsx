"use client";

import { FullPageError } from "@/components/shared/full-page-error";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <FullPageError
      error={error}
      reset={reset}
      className="min-h-[70vh]"
      decorative={false}
    />
  );
}
