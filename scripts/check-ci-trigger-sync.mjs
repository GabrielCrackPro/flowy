// Verifies that the push-trigger `paths` filter in .github/workflows/ci.yml
// stays in sync with the "Detect code changes" regex used by the quality job.
//
// Background: push CI on main only re-runs when the merge touched
// code/config (the `on.push.paths` list), while the quality job decides
// whether to run Typecheck & Build with its own regex. If the two drift
// apart, a code change could silently skip the push re-verification — or a
// docs change could be misclassified as code and burn a full build. This
// script fails with a clear diff when they disagree, so the drift is caught
// on the PR that introduces it, not discovered later as a missed build.
//
// The check runs in the `guardrails` job of ci.yml. Pure Node — no deps.
// Run locally: `node scripts/check-ci-trigger-sync.mjs`
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CI_PATH = join(ROOT, ".github", "workflows", "ci.yml");
const ci = readFileSync(CI_PATH, "utf8");
const lines = ci.split(/\r?\n/);

const fail = (...message) => {
  for (const part of message) console.error(`::error::${part}`);
  process.exit(1);
};

// --- Extract the push-trigger paths list -----------------------------------
// Anchor on the `push:` trigger (2-space indent) so a future `paths:` on
// another trigger (e.g. pull_request) can't be misread as this one.
const pushIndex = lines.findIndex((line) => /^ {2}push:$/.test(line));
if (pushIndex === -1) {
  fail(
    "Could not find the `push:` trigger in .github/workflows/ci.yml",
    "The CI trigger sync check cannot run without it.",
  );
}

const pathsIndex = lines
  .slice(pushIndex + 1)
  .findIndex((line) => /^ {4}paths:$/.test(line));
if (pathsIndex === -1) {
  fail(
    "Could not find a `paths:` filter on the push trigger in .github/workflows/ci.yml",
    "The push trigger needs an explicit paths list (see on.push.paths) for this check to run.",
  );
}

const pushPaths = [];
for (const line of lines.slice(pushIndex + 1 + pathsIndex + 1)) {
  const entry = line.match(/^ {6}- "?([^"]+)"?$/);
  if (entry) {
    pushPaths.push(entry[1]);
    continue;
  }
  // Reached a line that is not a paths entry (next key or end of block).
  if (/^\S/.test(line) || /^ {2,4}[a-z#]/.test(line)) break;
}

// --- Extract the "Detect code changes" regex -------------------------------
// Anchor on the step name instead of a literal inside the regex, so the
// locator survives regex rewrites.
const stepIndex = lines.findIndex((line) =>
  /- name: Detect code changes/.test(line),
);
if (stepIndex === -1) {
  fail(
    "Could not find the 'Detect code changes' step in .github/workflows/ci.yml",
    "The CI trigger sync check cannot run without it.",
  );
}
const stepLines = lines.slice(stepIndex, stepIndex + 30).join("\n");
const regexLine = stepLines.match(/grep -qE '([^']+)'/);
if (!regexLine) {
  fail(
    "Could not find the grep -qE regex in the 'Detect code changes' step of .github/workflows/ci.yml",
    "The CI trigger sync check cannot run without it.",
  );
}
const detectRegex = regexLine[1];

// --- Canonical models derived from each representation ---------------------
// Extensions: regex `\.(ts|tsx|...)` ⟷ paths `**/*.ts`, `**/*.tsx`, ...
const extsFromRegex =
  (detectRegex.match(/\\\.\(([a-z|]+)\)/) ?? [])[1]?.split("|").sort() ?? [];
const extsFromPaths = pushPaths
  .filter((p) => p.startsWith("**/*."))
  .map((p) => p.slice(5))
  .sort();

// Root config files: regex `(^package\.json$)` ⟷ paths `package.json`, ...
const rootsFromRegex = [...detectRegex.matchAll(/\(\^([^)]+)\$\)/g)]
  .map((m) => m[1].replace(/^\^/, "").replace(/\$$/, "").replace(/\\\./g, "."))
  .sort();
const rootsFromPaths = pushPaths.filter((p) => !p.includes("*")).sort();

// prisma/ directory: regex `(^prisma/)` ⟷ paths `prisma/**`
const prismaDirFromRegex = /\(\^prisma\/\)/.test(detectRegex);
const prismaDirFromPaths = pushPaths.includes("prisma/**");
const supabaseDirFromRegex = /\(\^supabase\/\)/.test(detectRegex);
const supabaseDirFromPaths = pushPaths.includes("supabase/**");

// --- Compare and report ----------------------------------------------------
const problems = [];
function check(label, fromRegex, fromPaths) {
  if (JSON.stringify(fromRegex) !== JSON.stringify(fromPaths)) {
    problems.push(
      `${label} mismatch between on.push.paths and the Detect code changes regex:\n` +
        `  paths: ${fromPaths.join(", ") || "(none)"}\n` +
        `  regex: ${fromRegex.join(", ") || "(none)"}`,
    );
  }
}
check("File extensions", extsFromRegex, extsFromPaths);
check("Root config files", rootsFromRegex, rootsFromPaths);
if (prismaDirFromRegex !== prismaDirFromPaths) {
  problems.push(
    `prisma/ directory mismatch: paths=${prismaDirFromPaths ? "prisma/**" : "missing"}, ` +
      `regex=${prismaDirFromRegex ? "^prisma/" : "missing"}`,
  );
}
if (supabaseDirFromRegex !== supabaseDirFromPaths) {
  problems.push(
    `supabase/ directory mismatch: paths=${supabaseDirFromPaths ? "supabase/**" : "missing"}, ` +
      `regex=${supabaseDirFromRegex ? "^supabase/" : "missing"}`,
  );
}

if (problems.length > 0) {
  fail(
    ...problems,
    "Keep the push-trigger paths and the Detect code changes regex in sync (see scripts/check-ci-trigger-sync.mjs).",
  );
}

console.log(
  "CI trigger sync check passed: push paths match the Detect code changes regex.",
);
