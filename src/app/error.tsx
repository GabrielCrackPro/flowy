"use client";

import { FullPageError } from "@/components/shared/full-page-error";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <FullPageError error={error} reset={reset} className="min-h-screen" />;
}
