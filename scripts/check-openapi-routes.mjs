#!/usr/bin/env node
/**
 * CI drift guard for the OpenAPI specification.
 *
 * Compares the actual route surface under `src/app/api` (file system +
 * exported handlers) against the documented paths in `public/openapi.json`:
 *
 *  1. Fails when a route handler exists but is missing from the spec
 *     (an undocumented route was added).
 *  2. Fails when the spec documents a route that no longer exists
 *     (a route was removed without updating the spec).
 *
 * The internal Scalar viewer at `src/app/api/docs` is excluded — it is an
 * HTML page for humans, not part of the data API.
 *
 * Run with: `pnpm check:openapi-routes`
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API_DIR = join(ROOT, "src", "app", "api");
const SPEC_FILE = join(ROOT, "public", "openapi.json");
const EXCLUDED_DIRS = new Set(["docs"]);

const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];
const HANDLER_RE = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/g;

function collectRouteFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        files.push(...collectRouteFiles(full));
      }
    } else if (entry.name === "route.ts") {
      files.push(full);
    }
  }
  return files;
}

function openApiPathFromFile(file) {
  const rel = relative(API_DIR, file).replaceAll("\\", "/");
  const withoutRouteFile = rel.replace(/\/route\.ts$/, "");
  return `/api/${withoutRouteFile.replace(/\[([^\]]+)\]/g, "{$1}")}`;
}

function methodsInFile(file) {
  const source = readFileSync(file, "utf8");
  const methods = new Set();
  for (const match of source.matchAll(HANDLER_RE)) {
    methods.add(match[1].toLowerCase());
  }
  return methods;
}

function fail(message) {
  console.error(`\n❌ ${message}`);
  process.exitCode = 1;
}

if (!existsSync(SPEC_FILE)) {
  fail(`Missing spec file ${SPEC_FILE}. Run \`pnpm generate:openapi\` first.`);
  process.exit(1);
}

let spec;
try {
  spec = JSON.parse(readFileSync(SPEC_FILE, "utf8"));
} catch (error) {
  fail(`Could not parse ${SPEC_FILE}: ${error.message}`);
  process.exit(1);
}

if (spec.openapi !== "3.1.0") {
  fail(`Expected OpenAPI 3.1.0 in ${SPEC_FILE}, got ${spec.openapi}`);
  process.exit(1);
}

// --- Index the spec ----------------------------------------------------------
const documented = new Map(); // openapi path -> Set<method>
for (const [path, item] of Object.entries(spec.paths ?? {})) {
  const methods = new Set(
    Object.keys(item).filter((key) => HTTP_METHODS.includes(key)),
  );
  documented.set(path, methods);
}

// --- Index the code surface --------------------------------------------------
const codeSurface = new Map(); // openapi path -> { file, methods: Set<method> }
for (const file of collectRouteFiles(API_DIR)) {
  const path = openApiPathFromFile(file);
  codeSurface.set(path, { file, methods: methodsInFile(file) });
}

// --- Check 1: every code route is documented ---------------------------------
let codeCount = 0;
for (const [path, { file, methods }] of codeSurface) {
  if (methods.size === 0) continue;
  codeCount += 1;
  const documentedMethods = documented.get(path);
  if (!documentedMethods) {
    fail(
      `Route ${path} (${relative(ROOT, file)}) is not documented in the OpenAPI spec. ` +
        `Add it to scripts/generate-openapi.ts and run \`pnpm generate:openapi\`.`,
    );
    continue;
  }
  for (const method of methods) {
    if (!documentedMethods.has(method)) {
      fail(
        `Route ${path} has a ${method.toUpperCase()} handler (${relative(ROOT, file)}) ` +
          `that is not documented in the spec.`,
      );
    }
  }
}

// --- Check 2: every documented route still exists -----------------------------
let specPathCount = 0;
for (const [path, methods] of documented) {
  const codeEntry = codeSurface.get(path);
  if (!codeEntry || codeEntry.methods.size === 0) {
    fail(
      `Spec documents ${path} but no route handler exists for it. ` +
        `Remove it from scripts/generate-openapi.ts and run \`pnpm generate:openapi\`.`,
    );
    continue;
  }
  specPathCount += 1;
  for (const method of methods) {
    if (!codeEntry.methods.has(method)) {
      fail(
        `Spec documents ${method.toUpperCase()} ${path} but no such handler exists.`,
      );
    }
  }
}

if (process.exitCode) {
  console.error(
    "\nThe OpenAPI spec has drifted from the route surface. Fix and re-run:",
  );
  console.error("  pnpm generate:openapi && pnpm check:openapi-routes\n");
} else {
  console.log(
    `✅ OpenAPI spec in sync: ${specPathCount} documented routes match ${codeCount} route files.`,
  );
}
