"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary. Only rendered when the root layout itself
 * fails, so it must render its own <html>/<body> and cannot rely on
 * providers (i18n, theme, etc.).
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
            <span aria-hidden="true" className="text-2xl font-bold">
              F
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Flowy hit an unexpected problem. Try reloading the page — if it
              keeps happening, contact support at support@flowy.app.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/";
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-medium text-foreground transition hover:bg-muted/50"
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
