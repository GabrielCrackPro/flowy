import { execFileSync } from "node:child_process";

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

const message = git("log", "-1", "--pretty=%B");
const files = git("diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD")
  .split(/\r?\n/)
  .filter(Boolean);

// Release Please changes package metadata and changelog bookkeeping. The
// following changelog-sync PR deploys the generated in-app data, so this
// intermediate release commit does not need its own production deployment.
const releaseMetadataFiles = new Set([
  ".release-please-manifest.json",
  "CHANGELOG.md",
  "package.json",
  "src/lib/changelog/generated.json",
]);
const isReleaseMetadataCommit =
  /^chore\(main\): release flowy \d+\.\d+\.\d+(?:\s|$)/i.test(message) &&
  files.length > 0 &&
  files.every((file) => releaseMetadataFiles.has(file));

if (isReleaseMetadataCommit) {
  console.log("Skipping deployment for Release Please metadata commit.");
  process.exit(0);
}

// Preserve the documented escape hatch, but never let it hide an application,
// dependency, database, or deployment configuration change.
const deployRelevant =
  /^(?:src\/|public\/|prisma\/|supabase\/|scripts\/|.*\.(?:ts|tsx|js|jsx|mjs|cjs|css|prisma|json))$/;
const hasDeployRelevantChange = files.some((file) => {
  if (
    file === "package.json" ||
    file === "pnpm-lock.yaml" ||
    file === "vercel.json"
  ) {
    return true;
  }
  return deployRelevant.test(file);
});

if (/\[skip deploy\]/i.test(message) && !hasDeployRelevantChange) {
  console.log("Skipping deployment for an explicitly non-deployable commit.");
  process.exit(0);
}

console.log("Deployment required.");
process.exit(1);
