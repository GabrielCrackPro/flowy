// Generates src/lib/changelog/generated.json from CHANGELOG.md (release-please
// keep-a-changelog format).
//
// Only user-facing sections are kept (Features, Bug Fixes) so the in-app
// changelog shows what actually matters to users — docs, chores and CI noise
// never reach the app. The current package.json version is embedded too, so
// the UI can mark the release the user is on.
//
// Deterministic output (no timestamps): the `changelog` CI job regenerates
// this file and fails if the committed copy drifts. Pure Node — no deps.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CHANGELOG_PATH = join(ROOT, "CHANGELOG.md");
const PACKAGE_PATH = join(ROOT, "package.json");
const OUTPUT_PATH = join(ROOT, "src", "lib", "changelog", "generated.json");

const HEADING_RE = /^## \[([^\]]+)\]\([^)]*\)\s*\((\d{4}-\d{2}-\d{2})\)/;
const SECTION_RE = /^### (.+)/;

// Section heading text → canonical type. Anything else is dropped.
const SECTION_TYPES = { Features: "features", "Bug Fixes": "fixes" };

/** Extracts the conventional-commit scope from the bold prefix (e.g. "**api-docs:**"). */
function parseScope(raw) {
  const match = raw.match(/^\*\*([^*]+):\*\*\s*/);
  if (match) {
    return { scope: match[1].trim(), rest: raw.slice(match[0].length) };
  }
  return { scope: null, rest: raw };
}

function cleanItem(raw) {
  const { scope, rest } = parseScope(raw);
  let text = rest.trim();
  // [label](url) → label (keeps PR refs like "(#72)", drops links)
  text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // Drop commit-hash refs: "(3b4bccd)"
  text = text.replace(/\s*\([0-9a-f]{7,40}\)/g, "");
  // Drop trailing "closes #71", "fixes #12 and #13"
  text = text.replace(/,\s*closes? #\d+(?: and #\d+)*\.?\s*$/i, "");
  text = text.replace(/\s+/g, " ").trim();
  return { text, scope };
}

const changelogText = readFileSync(CHANGELOG_PATH, "utf8");
const pkg = JSON.parse(readFileSync(PACKAGE_PATH, "utf8"));

const entries = [];
let current = null;

for (const rawLine of changelogText.split(/\r?\n/)) {
  const line = rawLine.trimEnd();
  const heading = line.match(HEADING_RE);
  if (heading) {
    current = { version: heading[1], date: heading[2], sections: [] };
    entries.push(current);
    continue;
  }
  if (!current) continue;

  const section = line.match(SECTION_RE);
  if (section) {
    current.sectionType = SECTION_TYPES[section[1].trim()] ?? null;
    continue;
  }

  if (!current.sectionType || !/^[*-]\s+/.test(line)) continue;

  const item = cleanItem(line.replace(/^[*-]\s+/, ""));
  if (!item) continue;

  const existing = current.sections.find((s) => s.type === current.sectionType);
  if (existing) {
    existing.items.push(item);
  } else {
    current.sections.push({ type: current.sectionType, items: [item] });
  }
}

// Drop releases with no user-facing content and serialize cleanly.
const data = {
  currentVersion: pkg.version,
  entries: entries
    .filter((entry) => entry.sections.length > 0)
    .map(({ version, date, sections }) => ({ version, date, sections })),
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");

const itemCount = data.entries.reduce(
  (n, entry) =>
    n + entry.sections.reduce((m, section) => m + section.items.length, 0),
  0,
);
const relative = OUTPUT_PATH.replace(`${ROOT}/`, "");
console.log(
  `changelog: ${data.entries.length} releases, ${itemCount} items → ${relative}`,
);
