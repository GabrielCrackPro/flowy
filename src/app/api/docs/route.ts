import { NextResponse } from "next/server";

/**
 * Interactive API reference for the Flowy REST API.
 *
 * Public on purpose (no auth): the docs should be shareable. The OpenAPI spec
 * is generated from code (`pnpm generate:openapi`) and committed at
 * `public/openapi.json`; this page only renders it via the Scalar web
 * component loaded from the jsDelivr CDN.
 */
const DOCS_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Flowy · API Reference</title>
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/openapi.json"
      data-layout="modern"
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>
`;

export async function GET() {
  return new NextResponse(DOCS_HTML, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
