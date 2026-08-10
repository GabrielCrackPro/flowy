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

// Flowy brand tokens (src/app/globals.css): blue-500 #3b82f6 (light) and
// blue-400 #60a5fa (dark). Single-line CSS for the data-custom-css attribute —
// no double quotes, "<" or "&" (none of which would survive attribute
// escaping).
const BRAND_CSS = [
  ":root{",
  "--scalar-color-accent:#3b82f6;",
  "--scalar-radius:8px;",
  "}",
  ".dark{",
  "--scalar-color-accent:#60a5fa;",
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
    <link rel="icon" href="/app-icon.svg" />
    <title>Flowy · API Reference</title>
  </head>
  <body>
    <div id="fallback" hidden style="font-family: system-ui, sans-serif; padding: 24px; color: #666">
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
