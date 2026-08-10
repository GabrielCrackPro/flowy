import generated from "./generated.json";

export type ChangelogSectionType = "features" | "fixes";

export interface ChangelogSection {
  type: ChangelogSectionType;
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  sections: ChangelogSection[];
}

export interface ChangelogData {
  currentVersion: string;
  entries: ChangelogEntry[];
}

/**
 * In-app changelog data, generated from CHANGELOG.md by
 * `scripts/generate-changelog.mjs` (user-facing sections only) and guarded
 * against drift by the `changelog` CI job.
 */
export const changelog = generated as ChangelogData;
