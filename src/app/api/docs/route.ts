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
 */
const SCALAR_VERSION = "1.64.1";

const SPEC_SOURCE = join(process.cwd(), "public", "openapi.json");

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

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
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
    ${
      specError
        ? `<p style="font-family: system-ui, sans-serif; padding: 24px; color: #666">Could not read the OpenAPI spec: ${specError.replace(/</g, "\\u003c")}</p>`
        : `<script id="api-reference" type="application/json" data-layout="modern">${spec}</script>`
    }
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
