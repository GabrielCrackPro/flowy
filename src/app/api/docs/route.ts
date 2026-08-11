import { readFileSync } from "node:fs";
import { join } from "node:path";

import { NextResponse } from "next/server";

/**
 * Interactive API reference for the Flowy REST API.
 *
 * Public on purpose (no auth): the docs should be shareable.
 *
 * The OpenAPI spec is generated from code (`pnpm generate:openapi`) and
 * committed at `public/openapi.json`. It is **inlined** into this page (rather
 * than fetched via `data-url`) so the reference cannot fail with "Document
 * could not be loaded" on a transient second request. The Scalar web component
 * is loaded from a **pinned** jsDelivr version for reproducibility.
 *
 * Branding: the spec carries an `x-logo` extension (Flowy mark) and the page
 * wires the app's blue accent (`#3b82f6` light / `#60a5fa` dark) plus the
 * Flowy favicon. Scalar is configured through data-* attributes: modern
 * layout, visible operation IDs, "Schemas" model label and JSON-only download.
 */
const SCALAR_VERSION = "1.64.1";

const SPEC_SOURCE = join(process.cwd(), "public", "openapi.json");

// Flowy brand tokens straight from src/app/globals.css (HSL triplets):
// background/foreground/primary/secondary/border map onto Scalar's theme
// variables so the reference matches the app in light and dark mode.
// Single-line CSS for the data-custom-css attribute — no double quotes, "<"
// or "&" (none of which would survive attribute escaping).
const BRAND_CSS = [
  ":root{",
  "--scalar-color-accent:hsl(221.2 83.2% 53.3%);",
  "--scalar-background-1:hsl(210 40% 98%);",
  "--scalar-background-2:hsl(210 40% 96.1%);",
  "--scalar-background-3:hsl(214.3 31.8% 91.4%);",
  "--scalar-color-1:hsl(222.2 84% 4.9%);",
  "--scalar-color-2:hsl(215.4 16.3% 46.9%);",
  "--scalar-color-3:hsl(215.4 16.3% 65%);",
  "--scalar-border-color:hsl(214.3 31.8% 91.4%);",
  "--scalar-radius:8px;",
  "}",
  ".dark{",
  "--scalar-color-accent:hsl(217.2 91.2% 59.8%);",
  "--scalar-background-1:hsl(222.2 84% 4.9%);",
  "--scalar-background-2:hsl(222.2 47.4% 11.2%);",
  "--scalar-background-3:hsl(217.2 32.6% 17.5%);",
  "--scalar-color-1:hsl(210 40% 98%);",
  "--scalar-color-2:hsl(215 20.2% 65.1%);",
  "--scalar-color-3:hsl(215 20.2% 50%);",
  "--scalar-border-color:hsl(217.2 32.6% 17.5%);",
  "}",
].join("");

export async function GET() {
  let spec = "";
  let specError = "";

  try {
    // Escape "<" as \u003c so the JSON stays valid and can't close the script
    // tag early (descriptions contain things like "Bearer <access_token>").
    spec = readFileSync(SPEC_SOURCE, "utf8").replace(/</g, "\\u003c");
  } catch (error) {
    specError = error instanceof Error ? error.message : String(error);
  }

  const reference = specError
    ? `<p style="font-family: system-ui, sans-serif; padding: 24px; color: #666">Could not read the OpenAPI spec: ${specError.replace(/</g, "\\u003c")}</p>`
    : `<script
      id="api-reference"
      type="application/json"
      data-theme="default"
      data-layout="modern"
      data-favicon="/app-icon.svg"
      data-show-operation-id="true"
      data-models-section-label="Schemas"
      data-document-download-type="json"
      data-custom-css="${BRAND_CSS}"
    >${spec}</script>`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="Flowy API reference — transactions, budgets, goals, subscriptions, spaces and more."
    />
    <meta name="theme-color" content="#3b82f6" />
    <meta property="og:title" content="Flowy · API Reference" />
    <meta
      property="og:description"
      content="Interactive reference for the Flowy REST API, generated from code."
    />
    <meta
      property="og:image"
      content="https://flowy-jade.vercel.app/app-icon.svg"
    />
    <link rel="icon" href="/app-icon.svg" />
    <title>Flowy · API Reference</title>
  </head>
  <body>
    <div
      id="fallback"
      hidden
      style="font-family: system-ui, sans-serif; padding: 32px; color: #666; text-align: center"
    >
      <img
        src="/app-icon.svg"
        alt="Flowy"
        width="56"
        height="56"
        style="border-radius: 12px"
      />
      <p style="margin-top: 12px; font-weight: 600; color: #333">
        Flowy API Reference
      </p>
      <p>The interactive reference could not load.</p>
      <p>
        Open the <a href="/openapi.json">raw OpenAPI document</a> instead, or
        try again in a moment.
      </p>
    </div>
    ${reference}
    <script
      src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@${SCALAR_VERSION}"
      onerror="document.getElementById('fallback').hidden = false"
    ></script>
  </body>
</html>
`;

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
