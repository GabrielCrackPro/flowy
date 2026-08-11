import { ApiReference } from "@scalar/nextjs-api-reference";

const SCALAR_CDN = "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.64.1";
const REPO_URL = "https://github.com/GabrielCrackPro/flowy";

const FLOWY_DOCS_CSS = `
/* biome-ignore-all lint/complexity/noImportantStyles: Scalar component styles load after customCss, so these scoped overrides intentionally win the cascade. */
/* biome-ignore-all lint/style/noDescendingSpecificity: Scalar component styles require intentional specificity for scoped overrides. */

:root {
  --flowy-api-page: #020617;
  --flowy-api-card: #0f172a;
  --flowy-api-elevated: #1e293b;
  --flowy-api-border: #1e293b;
  --flowy-api-primary: #3b82f6;
  --flowy-api-primary-hover: #60a5fa;
  --flowy-api-foreground: #f8fafc;
  --flowy-api-primary-foreground: #020617;
  --flowy-api-muted: #94a3b8;
  --flowy-api-code-blue: #93c5fd;
  --flowy-api-code-purple: #c7b5f2;
  --flowy-api-code-yellow: #f3d17b;
  --flowy-space-1: 4px;
  --flowy-space-2: 8px;
  --flowy-space-3: 12px;
  --flowy-space-4: 16px;
  --flowy-space-5: 24px;
  --flowy-card-radius: 12px;
  --flowy-sidebar-padding: 12px;
  --flowy-sidebar-row-height: 30px;
  --flowy-sidebar-search-height: 36px;
  --flowy-sidebar-item-gap: 2px;
  --flowy-sidebar-section-gap: 18px;
  --flowy-sidebar-item-radius: 8px;
  --flowy-control-height: 36px;
  --flowy-control-radius: 8px;
  --flowy-pill-radius: 999px;
  --flowy-focus-ring: 0 0 0 3px color-mix(in srgb, var(--flowy-api-primary) 16%, transparent);
  --flowy-transition: background-color 140ms ease, border-color 140ms ease, color 140ms ease;
  --flowy-content-max-width: 1440px;
  --flowy-header-height: 64px;

  /* The Flowy header is outside Scalar's app tree, so Scalar must not reserve
     another header row or viewport offset for it. */
  --scalar-custom-header-height: 0px;
  --scalar-header-height: 0px;
  --scalar-sidebar-width: 272px;
  --scalar-border-width: 1px;
  --scalar-color-1: var(--flowy-api-foreground);
  --scalar-color-2: var(--flowy-api-muted);
  --scalar-color-3: #64748b;
  --scalar-color-4: #475569;
  --scalar-color-accent: var(--flowy-api-primary);
  --scalar-background-1: var(--flowy-api-page);
  --scalar-background-2: var(--flowy-api-card);
  --scalar-background-3: var(--flowy-api-elevated);
  --scalar-background-accent: color-mix(in srgb, var(--flowy-api-primary) 12%, transparent);
  --scalar-border-color: var(--flowy-api-border);
  --scalar-radius: 8px;
  --scalar-font: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --scalar-font-code: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  --scalar-color-green: #86efac;
  --scalar-color-red: #fda4af;
  --scalar-color-yellow: #fde68a;
  --scalar-color-blue: #93c5fd;
  --scalar-color-orange: #fdba74;
  --scalar-color-purple: #c4b5fd;
  --scalar-color-cyan: #a5d8ff;
  --scalar-color-alert: #fdba74;
  --scalar-color-danger: #fda4af;
  --scalar-background-alert: color-mix(in srgb, var(--scalar-color-alert) 12%, var(--flowy-api-card));
  --scalar-background-danger: color-mix(in srgb, var(--scalar-color-danger) 12%, var(--flowy-api-card));
  --scalar-link-color: var(--flowy-api-primary-hover);
  --scalar-link-color-hover: var(--flowy-api-primary-hover);
  --scalar-button-1: var(--flowy-api-primary);
  --scalar-button-1-hover: var(--flowy-api-primary-hover);
  --scalar-button-1-color: var(--flowy-api-primary-foreground);
  --scalar-tooltip-background: var(--flowy-api-elevated);
  --scalar-tooltip-color: var(--flowy-api-foreground);
  --flowy-scrollbar-track: #0b1220;
  --flowy-scrollbar-thumb: #334155;
  --flowy-scrollbar-thumb-hover: #475569;
  --flowy-scrollbar-thumb-active: #64748b;
  --scalar-scrollbar-color: var(--flowy-scrollbar-thumb);
  --scalar-scrollbar-color-active: var(--flowy-scrollbar-thumb-active);

  --scalar-shadow-1: 0 1px 3px rgb(2 6 23 / 0.28);
  --scalar-shadow-2: 0 12px 28px rgb(2 6 23 / 0.42);
  --scalar-lifted-brightness: 1;
  --scalar-backdrop-brightness: 1;
  --scalar-sidebar-indent-border: var(--flowy-api-border);
  --scalar-sidebar-indent-border-hover: var(--flowy-api-primary);
  --scalar-sidebar-indent-border-active: var(--flowy-api-primary);
}

body.light-mode {
  --flowy-api-page: #f8fafc;
  --flowy-api-card: #f1f5f9;
  --flowy-api-elevated: #e2e8f0;
  --flowy-api-border: #e2e8f0;
  --flowy-api-primary: #2563eb;
  --flowy-api-primary-hover: #1d4ed8;
  --flowy-api-foreground: #0f172a;
  --flowy-api-primary-foreground: #f8fafc;
  --flowy-api-muted: #64748b;
  --flowy-api-code-blue: #2563eb;
  --flowy-api-code-purple: #7c5fb2;
  --flowy-api-code-yellow: #a16207;

  --scalar-color-1: var(--flowy-api-foreground);
  --scalar-color-2: var(--flowy-api-muted);
  --scalar-color-3: #94a3b8;
  --scalar-color-4: #cbd5e1;
  --scalar-color-accent: var(--flowy-api-primary);
  --scalar-background-1: var(--flowy-api-page);
  --scalar-background-2: var(--flowy-api-card);
  --scalar-background-3: var(--flowy-api-elevated);
  --scalar-background-accent: color-mix(in srgb, var(--flowy-api-primary) 10%, transparent);
  --scalar-border-color: var(--flowy-api-border);
  --scalar-color-green: #15803d;
  --scalar-color-red: #be123c;
  --scalar-color-yellow: #a16207;
  --scalar-color-blue: #2563eb;
  --scalar-color-orange: #c2410c;
  --scalar-color-purple: #7c3aed;
  --scalar-color-cyan: #2563eb;
  --scalar-color-alert: #c2410c;
  --scalar-color-danger: #be123c;
  --scalar-background-alert: color-mix(in srgb, var(--scalar-color-alert) 10%, var(--flowy-api-card));
  --scalar-background-danger: color-mix(in srgb, var(--scalar-color-danger) 10%, var(--flowy-api-card));
  --scalar-link-color: var(--flowy-api-primary);
  --scalar-link-color-hover: var(--flowy-api-primary-hover);
  --scalar-button-1: var(--flowy-api-primary);
  --scalar-button-1-hover: var(--flowy-api-primary-hover);
  --scalar-button-1-color: var(--flowy-api-primary-foreground);
  --scalar-tooltip-background: var(--flowy-api-elevated);
  --scalar-tooltip-color: var(--flowy-api-foreground);
  --flowy-scrollbar-track: #eef2f7;
  --flowy-scrollbar-thumb: #cbd5e1;
  --flowy-scrollbar-thumb-hover: #94a3b8;
  --flowy-scrollbar-thumb-active: #64748b;
  --scalar-scrollbar-color: var(--flowy-scrollbar-thumb);
  --scalar-scrollbar-color-active: var(--flowy-scrollbar-thumb-active);

  --scalar-shadow-1: 0 1px 3px rgb(15 23 42 / 0.12);
  --scalar-shadow-2: 0 12px 28px rgb(15 23 42 / 0.16);
  --scalar-lifted-brightness: 1;
  --scalar-backdrop-brightness: 1;
  --scalar-sidebar-indent-border: var(--flowy-api-border);
  --scalar-sidebar-indent-border-hover: var(--flowy-api-primary);
  --scalar-sidebar-indent-border-active: var(--flowy-api-primary);
}

/* Keep every documentation scroll surface quiet and consistent with Flowy. */
html,
body,
.flowy-docs-header,
.flowy-docs-header + #app,
.scalar-app,
.scalar-app *,
.scalar-app :is(.sidebar, .references-layout > aside, .sidebar-scrollbar) {
  scrollbar-width: thin;
  scrollbar-color: var(--flowy-scrollbar-thumb) var(--flowy-scrollbar-track);
}

.scalar-app :is(.sidebar, .references-layout > aside, .sidebar-scrollbar) {
  scrollbar-gutter: stable;
  overscroll-behavior: contain;
}

html::-webkit-scrollbar,
body::-webkit-scrollbar,
.flowy-docs-header::-webkit-scrollbar,
.flowy-docs-header + #app::-webkit-scrollbar,
.scalar-app ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.scalar-app :is(.sidebar, .references-layout > aside, .sidebar-scrollbar)::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

html::-webkit-scrollbar-track,
body::-webkit-scrollbar-track,
.flowy-docs-header::-webkit-scrollbar-track,
.flowy-docs-header + #app::-webkit-scrollbar-track,
.scalar-app ::-webkit-scrollbar-track,
.scalar-app :is(.sidebar, .references-layout > aside, .sidebar-scrollbar)::-webkit-scrollbar-track {
  background: var(--flowy-scrollbar-track);
}

html::-webkit-scrollbar-thumb,
body::-webkit-scrollbar-thumb,
.flowy-docs-header::-webkit-scrollbar-thumb,
.flowy-docs-header + #app::-webkit-scrollbar-thumb,
.scalar-app ::-webkit-scrollbar-thumb,
.scalar-app :is(.sidebar, .references-layout > aside, .sidebar-scrollbar)::-webkit-scrollbar-thumb {
  min-height: 40px;
  border: 3px solid var(--flowy-scrollbar-track);
  border-radius: var(--flowy-pill-radius);
  background: var(--flowy-scrollbar-thumb);
  background-clip: padding-box;
  transition: background-color 140ms ease;
}

html::-webkit-scrollbar-thumb:hover,
body::-webkit-scrollbar-thumb:hover,
.flowy-docs-header::-webkit-scrollbar-thumb:hover,
.flowy-docs-header + #app::-webkit-scrollbar-thumb:hover,
.scalar-app ::-webkit-scrollbar-thumb:hover,
.scalar-app :is(.sidebar, .references-layout > aside, .sidebar-scrollbar)::-webkit-scrollbar-thumb:hover {
  background: var(--flowy-scrollbar-thumb-hover);
}

html::-webkit-scrollbar-thumb:active,
body::-webkit-scrollbar-thumb:active,
.flowy-docs-header::-webkit-scrollbar-thumb:active,
.flowy-docs-header + #app::-webkit-scrollbar-thumb:active,
.scalar-app ::-webkit-scrollbar-thumb:active,
.scalar-app :is(.sidebar, .references-layout > aside, .sidebar-scrollbar)::-webkit-scrollbar-thumb:active {
  background: var(--flowy-scrollbar-thumb-active);
}

html::-webkit-scrollbar-corner,
body::-webkit-scrollbar-corner,
.flowy-docs-header::-webkit-scrollbar-corner,
.flowy-docs-header + #app::-webkit-scrollbar-corner,
.scalar-app ::-webkit-scrollbar-corner,
.scalar-app :is(.sidebar, .references-layout > aside, .sidebar-scrollbar)::-webkit-scrollbar-corner {
  background: var(--flowy-scrollbar-track);
}

body {
  margin: 0;
  background: var(--flowy-api-page);
  font-family: var(--scalar-font);
}

.flowy-docs-header + #app,
.flowy-docs-header + #app > .scalar-app,
.flowy-docs-header + #app .references-layout,
.flowy-docs-header + #app .references-layout > *,
.flowy-docs-header + #app .references-rendered,
.flowy-docs-header + #app .narrow-references-container,
.flowy-docs-header + #app .sidebar,
.flowy-docs-header + #app aside {
  --scalar-custom-header-height: 0px !important;
  --scalar-header-height: 0px !important;
  --refs-viewport-offset: 0px !important;
  margin-top: 0 !important;
  padding-top: 0 !important;
}

.flowy-docs-header + #app,
.flowy-docs-header + #app > .scalar-app,
.flowy-docs-header + #app .references-layout,
.flowy-docs-header + #app .sidebar,
.flowy-docs-header + #app aside {
  top: 0 !important;
}

.scalar-app,
.scalar-app .references-rendered,
.scalar-app .narrow-references-container {
  background: var(--flowy-api-page);
  color: var(--flowy-api-foreground);
}

.scalar-app,
.scalar-app *,
.scalar-app *::before,
.scalar-app *::after {
  box-sizing: border-box;
}

.scalar-app a {
  color: var(--flowy-api-primary);
}

.scalar-app a:hover {
  color: var(--flowy-api-primary-hover);
  text-decoration: underline;
}

.scalar-app :focus-visible {
  outline: 2px solid var(--flowy-api-primary);
  outline-offset: 2px;
}

.scalar-app .scalar-card {
  border-color: var(--flowy-api-border);
  background: var(--flowy-api-card);
  box-shadow: var(--scalar-shadow-1);
}

.scalar-app .scalar-card-header,
.scalar-app .scalar-card-footer {
  border-color: var(--flowy-api-border);
  background: var(--flowy-api-elevated);
}

.scalar-app input,
.scalar-app textarea,
.scalar-app select {
  border-color: var(--flowy-api-border);
  background: var(--flowy-api-page);
  color: var(--flowy-api-foreground);
}

.scalar-app :is([role="dialog"], [role="menu"], [role="listbox"], .scalar-popover, .scalar-dropdown, .scalar-modal) {
  border: 1px solid var(--flowy-api-border);
  background: var(--flowy-api-card);
  color: var(--flowy-api-foreground);
  box-shadow: var(--scalar-shadow-2);
}

.scalar-app :is(table, th, td, .headers-properties, .headers-card, .property) {
  border-color: var(--flowy-api-border);
}

.scalar-app :is(th, .headers-card-title, .parameter-list-title) {
  color: var(--flowy-api-muted);
}

.scalar-app :is(pre, code, .scalar-code-block) {
  border-color: var(--flowy-api-border);
  background: var(--flowy-api-page);
  color: var(--flowy-api-foreground);
  font-family: var(--scalar-font-code);
}

.scalar-app {
  --scalar-color-green: var(--flowy-method-post) !important;
  --scalar-color-red: var(--flowy-method-delete) !important;
  --scalar-color-yellow: var(--flowy-method-put) !important;
  --scalar-color-blue: var(--flowy-method-get) !important;
  --scalar-color-orange: var(--flowy-method-put) !important;
  --scalar-color-purple: var(--flowy-method-patch) !important;
  --scalar-color-cyan: var(--flowy-method-get) !important;
  --scalar-color-accent: var(--flowy-api-primary) !important;
  --scalar-button-1: var(--flowy-api-primary) !important;
  --scalar-button-1-hover: var(--flowy-api-primary-hover) !important;
  --scalar-button-1-color: var(--flowy-api-primary-foreground) !important;
  --scalar-border-color: var(--flowy-api-border) !important;
  --scalar-background-1: var(--flowy-api-page) !important;
  --scalar-background-2: var(--flowy-api-card) !important;
  --scalar-background-3: var(--flowy-api-elevated) !important;
  --scalar-scrollbar-color: var(--flowy-scrollbar-thumb) !important;
  --scalar-scrollbar-color-active: var(--flowy-scrollbar-thumb-active) !important;
}

body.light-mode .scalar-app {
  --scalar-color-accent: var(--flowy-api-primary) !important;
  --scalar-sidebar-color-active: var(--flowy-api-primary) !important;
  --scalar-button-1-color: var(--flowy-api-primary-foreground) !important;
}

/* Sidebar: one scoped block owns the surface, spacing, navigation states,
   and search controls. Scalar's semantic variables remain the source of truth
   for its internal components, while these rules provide the Flowy layout. */
.scalar-app {
  --scalar-sidebar-padding: var(--flowy-sidebar-padding) !important;
  --scalar-sidebar-indent: 20px !important;
  --scalar-sidebar-background-1: var(--flowy-api-page) !important;
  --scalar-sidebar-color-1: var(--flowy-api-foreground) !important;
  --scalar-sidebar-color-2: var(--flowy-api-muted) !important;
  --scalar-sidebar-color-active: var(--flowy-api-primary-hover) !important;
  --scalar-sidebar-border-color: var(--flowy-api-border) !important;
  --scalar-sidebar-indent-border: var(--flowy-api-border) !important;
  --scalar-sidebar-indent-border-hover: var(--flowy-api-primary) !important;
  --scalar-sidebar-indent-border-active: var(--flowy-api-primary) !important;
  --scalar-sidebar-item-hover-color: var(--flowy-api-foreground) !important;
  --scalar-sidebar-item-hover-background: var(--flowy-api-card) !important;
  --scalar-sidebar-item-active-background: color-mix(in srgb, var(--flowy-api-primary) 12%, transparent) !important;
  --scalar-sidebar-search-background: var(--flowy-api-card) !important;
  --scalar-sidebar-search-border-color: var(--flowy-api-border) !important;
  --scalar-sidebar-search-color: var(--flowy-api-muted) !important;
}

body.light-mode .scalar-app {
  --scalar-sidebar-color-active: var(--flowy-api-primary) !important;
  --scalar-sidebar-item-active-background: color-mix(in srgb, var(--flowy-api-primary) 9%, transparent) !important;
}

.scalar-app :is(.sidebar, .references-layout > aside) {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: var(--scalar-sidebar-width);
  min-width: var(--scalar-sidebar-width);
  margin: 0 !important;
  padding: 0 var(--scalar-sidebar-padding) var(--scalar-sidebar-padding) !important;
  border-right: 1px solid var(--scalar-sidebar-border-color) !important;
  background: var(--scalar-sidebar-background-1) !important;
  color: var(--scalar-sidebar-color-1) !important;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  scrollbar-color: var(--flowy-scrollbar-thumb) var(--flowy-scrollbar-track);
}

.scalar-app :is(.sidebar, .references-layout > aside) > :first-child,
.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-scrollbar {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

.scalar-app :is(.sidebar, .references-layout > aside) :is(a, button, [role="button"]) {
  min-height: var(--flowy-sidebar-row-height);
  margin-block: var(--flowy-sidebar-item-gap);
  border-radius: var(--flowy-sidebar-item-radius);
  color: var(--scalar-sidebar-color-1);
  text-decoration: none;
  transition: var(--flowy-transition);
}

.scalar-app :is(.sidebar, .references-layout > aside) :is(a, button, [role="button"]):hover {
  border-color: transparent;
  background: color-mix(in srgb, var(--flowy-api-primary) 7%, var(--flowy-api-page));
  color: var(--scalar-sidebar-item-hover-color);
}

.scalar-app :is(.sidebar, .references-layout > aside) :is(a, button, [role="button"]):is([aria-current="true"], [aria-current="page"], [aria-selected="true"], [data-selected="true"], [data-active="true"]) {
  border-color: transparent;
  background: var(--scalar-sidebar-item-active-background);
  box-shadow: inset 3px 0 var(--flowy-api-primary);
  color: var(--scalar-sidebar-color-active);
  font-weight: 600;
}

.scalar-app :is(.sidebar, .references-layout > aside) :is(a, button, [role="button"]):focus-visible {
  border-color: transparent;
  background: color-mix(in srgb, var(--flowy-api-primary) 9%, transparent);
  box-shadow: var(--flowy-focus-ring);
}

.scalar-app :is(.sidebar, .references-layout > aside) [data-sidebar-id] {
  margin-block: var(--flowy-sidebar-item-gap);
  border-radius: var(--flowy-sidebar-item-radius);
}

/* Only operation entries need wrapping. Folder and section controls retain
   Scalar's compact single-line rhythm. */
.scalar-app :is(.sidebar, .references-layout > aside) :is(a, button, [role="button"]):has(.sidebar-heading-type) {
  align-items: flex-start;
  height: auto;
  min-height: var(--flowy-sidebar-row-height);
  padding-block: 6px;
  overflow: visible;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.35;
}

.scalar-app :is(.sidebar, .references-layout > aside) :is(h2, h3, [role="heading"]) {
  margin: var(--flowy-sidebar-section-gap) var(--flowy-space-2) var(--flowy-space-1);
  padding: 0 var(--flowy-space-1);
  color: var(--scalar-sidebar-color-2);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  user-select: none;
}

.scalar-app :is(.sidebar, .references-layout > aside) :is(input, [role="searchbox"]) {
  width: 100%;
  min-width: 0;
  min-height: var(--flowy-sidebar-search-height);
  margin: var(--flowy-space-2) 0 var(--flowy-space-4);
  padding: 0 var(--flowy-space-3);
  border: 1px solid var(--scalar-sidebar-search-border-color) !important;
  border-radius: var(--flowy-control-radius);
  background: var(--scalar-sidebar-search-background) !important;
  color: var(--scalar-sidebar-color-1) !important;
  font-size: 13px;
  line-height: 1.4;
  transition: var(--flowy-transition);
  box-shadow: none;
}

.scalar-app :is(.sidebar, .references-layout > aside) :is(input, [role="searchbox"])::placeholder {
  color: var(--scalar-sidebar-search-color);
  opacity: 1;
}

.scalar-app :is(.sidebar, .references-layout > aside) :is(input, [role="searchbox"]):focus {
  border-color: var(--flowy-api-primary) !important;
  box-shadow: var(--flowy-focus-ring);
}

/* Scalar renders the desktop search as a button that opens the search modal.
   Target its stable placeholder class instead of styling every sidebar button. */
.scalar-app :is(.sidebar, .references-layout > aside) button:has(.sidebar-search-placeholder) {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--flowy-sidebar-search-height);
  margin: var(--flowy-space-2) 0 var(--flowy-space-4);
  padding: 0 var(--flowy-space-2);
  border: 1px solid var(--scalar-sidebar-search-border-color) !important;
  border-radius: var(--flowy-control-radius);
  background: var(--scalar-sidebar-search-background) !important;
  color: var(--scalar-sidebar-search-color) !important;
  font-size: 13px;
  line-height: 1.4;
  text-align: left;
  transition: var(--flowy-transition);
}

.scalar-app :is(.sidebar, .references-layout > aside) button:has(.sidebar-search-placeholder):hover {
  border-color: color-mix(in srgb, var(--flowy-api-primary) 42%, var(--flowy-api-border)) !important;
  background: color-mix(in srgb, var(--flowy-api-primary) 6%, var(--flowy-api-card)) !important;
  color: var(--scalar-sidebar-color-1) !important;
}

.scalar-app :is(.sidebar, .references-layout > aside) button:has(.sidebar-search-placeholder):focus-visible {
  border-color: var(--flowy-api-primary) !important;
  background: var(--scalar-sidebar-search-background) !important;
  box-shadow: var(--flowy-focus-ring);
}

.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-search-placeholder {
  min-width: 0;
  overflow: hidden;
  color: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scalar-app :is(.sidebar, .references-layout > aside) button:has(.sidebar-search-placeholder) kbd {
  flex: 0 0 auto;
  margin-left: var(--flowy-space-2);
  padding: 2px 5px;
  border: 1px solid var(--flowy-api-border);
  border-radius: 5px;
  background: var(--flowy-api-elevated);
  color: var(--flowy-api-muted);
  font-family: var(--scalar-font-code);
  font-size: 10px;
  line-height: 1.2;
}

body.light-mode {
  --flowy-method-get: #6d9fe8;
  --flowy-method-post: #72c28a;
  --flowy-method-put: #d9ad58;
  --flowy-method-patch: #a996dc;
  --flowy-method-delete: #df8795;
  --flowy-method-options: #6dbdca;
  --flowy-method-head: #8492a6;
  --flowy-method-trace: #d396b8;
  --flowy-method-connect: #b294d7;
}

body:not(.light-mode) {
  --flowy-method-get: #8bb8f2;
  --flowy-method-post: #91dda8;
  --flowy-method-put: #f3d17b;
  --flowy-method-patch: #c7b5f2;
  --flowy-method-delete: #f3a5b0;
  --flowy-method-options: #91dce7;
  --flowy-method-head: #b4becb;
  --flowy-method-trace: #efb2d1;
  --flowy-method-connect: #d9baf4;
}

.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-heading-type--get { --method-color: var(--flowy-method-get) !important; }
.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-heading-type--post { --method-color: var(--flowy-method-post) !important; }
.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-heading-type--put { --method-color: var(--flowy-method-put) !important; }
.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-heading-type--patch { --method-color: var(--flowy-method-patch) !important; }
.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-heading-type--delete { --method-color: var(--flowy-method-delete) !important; }
.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-heading-type--options { --method-color: var(--flowy-method-options) !important; }
.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-heading-type--head { --method-color: var(--flowy-method-head) !important; }
.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-heading-type--trace { --method-color: var(--flowy-method-trace) !important; }
.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-heading-type--connect { --method-color: var(--flowy-method-connect) !important; }

.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-heading-type {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  margin-top: 1px;
  min-width: 34px;
  height: 18px;
  justify-content: center;
  padding: 0 6px;
  border: 1px solid color-mix(in srgb, var(--method-color, currentColor) 38%, transparent);
  border-radius: var(--flowy-pill-radius);
  background: color-mix(in srgb, var(--method-color, currentColor) 14%, transparent);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 16px;
  flex: 0 0 34px;
  font-family: var(--scalar-font-code);
  font-variant-numeric: tabular-nums;
  text-align: center;
}

.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-heading-type:hover,
.scalar-app :is(.sidebar, .references-layout > aside) .sidebar-heading-type-active {
  border-color: color-mix(in srgb, var(--method-color, currentColor) 58%, transparent);
  background: color-mix(in srgb, var(--method-color, currentColor) 24%, transparent);
}

.scalar-app .scalar-reference-intro-clients,
.scalar-app .darklight-reference a[href="https://www.scalar.com"] {
  display: none !important;
}

.scalar-app .references-rendered .examples {
  display: flex;
  flex-direction: column;
  gap: var(--flowy-space-3);
  min-width: 0;
  padding-left: var(--flowy-space-1);
  margin-top: 0 !important;
  padding-top: 0 !important;
  top: 0 !important;
}

.scalar-app .references-rendered .operation-layout,
.scalar-app .references-rendered .examples > * {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

.scalar-app .references-rendered .examples > .request-card,
.scalar-app .references-rendered .examples > .response-card {
  margin: 0;
  border: 1px solid var(--flowy-api-border);
  border-radius: var(--flowy-card-radius);
  background: var(--flowy-api-card);
  box-shadow: var(--scalar-shadow-1);
}

.scalar-app .references-rendered .examples > .response-card {
  overflow: hidden;
  border-top: 2px solid color-mix(in srgb, var(--flowy-api-primary) 58%, var(--flowy-api-border));
}

.scalar-app .references-rendered .response-card .tab {
  border-radius: 6px;
  color: var(--flowy-api-muted);
  padding: 2px 5px;
}

.scalar-app .references-rendered .response-card .tab::before,
.scalar-app .references-rendered .response-card .tab-selected {
  background: color-mix(in srgb, var(--flowy-api-primary) 12%, transparent);
}

.scalar-app .references-rendered .response-card .tab-selected,
.scalar-app .references-rendered .response-card .code-copy:hover,
.scalar-app .references-rendered .response-card .scalar-card-checkbox:hover {
  color: var(--flowy-api-primary-hover);
}

.scalar-app .references-rendered .response-card .scalar-card-section,
.scalar-app .references-rendered .response-card .scalar-code-block {
  background: var(--flowy-api-page) !important;
}

.scalar-app .references-rendered .response-card .response-card-footer {
  border-top: 1px solid var(--flowy-api-border);
  background: var(--flowy-api-elevated);
  color: var(--flowy-api-muted);
}

.scalar-app .references-rendered .response-card .schema-type {
  border: 1px solid var(--flowy-api-border);
  background: color-mix(in srgb, var(--flowy-api-primary) 12%, transparent);
  color: var(--flowy-api-primary-hover);
}

/* Content surface and typography */
.scalar-app .references-rendered .section {
  max-width: var(--flowy-content-max-width);
  margin-inline: auto;
  padding: 48px 40px;
  border-bottom: 1px solid var(--flowy-api-border);
  scroll-margin-top: 0;
}

.scalar-app .references-rendered .section:first-child {
  padding-top: 32px;
}

.scalar-app .references-rendered .section-content {
  min-width: 0;
}

.scalar-app .references-rendered .section-header-wrapper {
  column-gap: 40px;
}

.scalar-app .references-rendered .section-header {
  margin-bottom: var(--flowy-space-3);
  color: var(--flowy-api-foreground);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
}

.scalar-app .references-rendered .section-header-label,
.scalar-app .references-rendered .operation-title {
  color: var(--flowy-api-foreground);
}

.scalar-app .references-rendered .operation-layout {
  column-gap: 40px;
}

.scalar-app .references-rendered .operation-title {
  margin-bottom: var(--flowy-space-3);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.scalar-app .references-rendered .operation-title.deprecated,
.scalar-app .references-rendered .operation-auth {
  color: var(--flowy-api-muted);
}

.scalar-app .references-rendered .operation-auth {
  align-self: start;
  font-size: 12px;
}

/* Scalar Markdown: keep every rendered description, note, table, and code
   sample on the same Flowy reading rhythm. */
.scalar-app .references-rendered .markdown {
  --scalar-refs-heading-spacing: 16px;
  --markdown-spacing-sm: 8px;
  --markdown-spacing-md: 12px;
  --markdown-line-height: 1.65;
  --markdown-heading-line-height: 1.25;
  color: var(--flowy-api-foreground);
  font-family: var(--scalar-font);
  font-size: 15px;
  line-height: 1.65;
  word-break: break-word;
}

.scalar-app .references-rendered .markdown > * {
  margin-block: 0 var(--flowy-space-3);
}

.scalar-app .references-rendered .markdown > :last-child {
  margin-bottom: 0;
}

.scalar-app .references-rendered .markdown :is(h1, h2, h3, h4, h5, h6) {
  margin: var(--flowy-space-5) 0 var(--flowy-space-2);
  color: var(--flowy-api-foreground);
  font-weight: 700;
  line-height: 1.25;
  scroll-margin-top: 1rem;
}

.scalar-app .references-rendered .markdown h1 {
  font-size: 24px;
  letter-spacing: -0.02em;
}

.scalar-app .references-rendered .markdown h2 {
  font-size: 20px;
  letter-spacing: -0.015em;
}

.scalar-app .references-rendered .markdown h3 {
  font-size: 18px;
}

.scalar-app .references-rendered .markdown :is(h4, h5, h6) {
  font-size: 16px;
}

.scalar-app .references-rendered .markdown :is(p, li) {
  color: var(--flowy-api-foreground);
}

.scalar-app .references-rendered .markdown :is(strong, b) {
  color: var(--flowy-api-foreground);
  font-weight: 700;
}

.scalar-app .references-rendered .markdown :is(a, a:visited) {
  color: var(--flowy-api-primary-hover);
  font-weight: 600;
  text-decoration-color: color-mix(in srgb, var(--flowy-api-primary) 45%, transparent);
  text-underline-offset: 3px;
}

.scalar-app .references-rendered .markdown a:hover {
  color: var(--flowy-api-primary-hover);
  text-decoration-color: var(--flowy-api-primary-hover);
}

.scalar-app .references-rendered .markdown :is(ul, ol) {
  gap: var(--flowy-space-1);
  padding-left: 1.5rem;
}

.scalar-app .references-rendered .markdown li::marker {
  color: var(--flowy-api-primary-hover);
}

.scalar-app .references-rendered .markdown :not(pre) > code {
  border: 1px solid var(--flowy-api-border);
  border-radius: 5px;
  background: var(--flowy-api-elevated);
  box-shadow: none;
  color: var(--flowy-api-code-blue);
  font-family: var(--scalar-font-code);
  font-size: 0.88em;
  padding: 2px 5px;
}

.scalar-app .references-rendered .markdown pre {
  overflow-x: auto;
  margin-block: var(--flowy-space-3);
  border: 1px solid var(--flowy-api-border);
  border-radius: var(--flowy-card-radius);
  background: var(--flowy-api-page);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--flowy-api-foreground) 3%, transparent);
}

.scalar-app .references-rendered .markdown pre code {
  display: block;
  min-width: 0;
  padding: var(--flowy-space-3);
  background: transparent;
  color: var(--flowy-api-foreground);
  font-family: var(--scalar-font-code);
  font-size: 13px;
  line-height: 1.6;
}

.scalar-app .references-rendered .markdown :is(table, th, td) {
  border-color: var(--flowy-api-border);
}

.scalar-app .references-rendered .markdown table {
  overflow: hidden;
  width: max-content;
  max-width: 100%;
  border: 1px solid var(--flowy-api-border);
  border-radius: var(--flowy-card-radius);
  background: var(--flowy-api-card);
}

.scalar-app .references-rendered .markdown th {
  background: var(--flowy-api-elevated);
  color: var(--flowy-api-foreground);
  font-weight: 700;
}

.scalar-app .references-rendered .markdown td {
  background: var(--flowy-api-card);
  color: var(--flowy-api-foreground);
}

.scalar-app .references-rendered .markdown blockquote {
  margin-inline: 0;
  padding: var(--flowy-space-2) var(--flowy-space-3);
  border-left: 3px solid var(--flowy-api-primary);
  border-radius: 0 var(--flowy-space-1) var(--flowy-space-1) 0;
  background: color-mix(in srgb, var(--flowy-api-primary) 8%, transparent);
  color: var(--flowy-api-muted);
}

.scalar-app .references-rendered .markdown hr {
  margin-block: var(--flowy-space-5);
  border-bottom-color: var(--flowy-api-border);
}

.scalar-app .references-rendered .markdown details {
  border-color: var(--flowy-api-border);
  border-radius: var(--flowy-card-radius);
  background: var(--flowy-api-card);
}

.scalar-app .references-rendered .markdown summary {
  border-radius: var(--flowy-card-radius);
  color: var(--flowy-api-foreground);
}

.scalar-app .references-rendered .markdown summary:hover {
  background: var(--flowy-api-elevated);
}

.scalar-app .references-rendered .markdown .markdown-alert {
  border-radius: var(--flowy-card-radius);
  border-color: var(--flowy-api-border);
  background: color-mix(in srgb, var(--flowy-api-card) 92%, transparent);
  color: var(--flowy-api-foreground);
}

.scalar-app .references-rendered .markdown .markdown-alert.markdown-alert-note {
  border-color: color-mix(in srgb, var(--flowy-api-primary) 45%, var(--flowy-api-border));
  background: color-mix(in srgb, var(--flowy-api-primary) 9%, var(--flowy-api-card));
}

.scalar-app .references-rendered .markdown .markdown-alert.markdown-alert-warning,
.scalar-app .references-rendered .markdown .markdown-alert.markdown-alert-important {
  border-color: color-mix(in srgb, var(--scalar-color-orange) 45%, var(--flowy-api-border));
  background: color-mix(in srgb, var(--scalar-color-orange) 9%, var(--flowy-api-card));
}

.scalar-app .references-rendered .markdown .markdown-alert.markdown-alert-caution {
  border-color: color-mix(in srgb, var(--scalar-color-red) 45%, var(--flowy-api-border));
  background: color-mix(in srgb, var(--scalar-color-red) 9%, var(--flowy-api-card));
}

.scalar-app .references-rendered .markdown .markdown-alert.markdown-alert-success {
  border-color: color-mix(in srgb, var(--scalar-color-green) 45%, var(--flowy-api-border));
  background: color-mix(in srgb, var(--scalar-color-green) 9%, var(--flowy-api-card));
}

.scalar-app .references-rendered .markdown .markdown-alert-content {
  color: var(--flowy-api-foreground);
}

.scalar-app .references-rendered .operation-description {
  max-width: 72ch;
  color: var(--flowy-api-foreground);
  font-size: 15px;
  line-height: 1.7;
}

.scalar-app .references-rendered .operation-description :is(p, ul, ol, blockquote, pre, table) {
  margin-block: var(--flowy-space-3);
}

.scalar-app .references-rendered .operation-description :is(ul, ol) {
  padding-left: 1.25rem;
}

.scalar-app .references-rendered .operation-description :is(li, p) {
  color: var(--flowy-api-foreground);
}

.scalar-app .references-rendered .operation-description a {
  color: var(--flowy-api-primary-hover);
  font-weight: 600;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.scalar-app .references-rendered .operation-description :is(code, .t-editor__inline-code) {
  border: 1px solid var(--flowy-api-border);
  border-radius: 5px;
  background: var(--flowy-api-elevated);
  color: var(--flowy-api-code-blue);
  font-family: var(--scalar-font-code);
  font-size: 0.88em;
  padding: 2px 5px;
}

.scalar-app .references-rendered .operation-description blockquote {
  margin-left: 0;
  padding: var(--flowy-space-2) var(--flowy-space-3);
  border-left: 3px solid var(--flowy-api-primary);
  background: color-mix(in srgb, var(--flowy-api-primary) 8%, transparent);
  color: var(--flowy-api-muted);
}

.scalar-app .references-rendered .operation-details {
  min-width: 0;
  margin-top: var(--flowy-space-5);
}

.scalar-app .references-rendered .operation-details > :is(div, section) {
  margin-top: var(--flowy-space-5);
}

.scalar-app .references-rendered .operation-details > :first-child {
  margin-top: 0;
}

.scalar-app .references-rendered .parameter-item {
  border-top-color: var(--flowy-api-border);
}

.scalar-app .references-rendered .parameter-item-trigger {
  min-height: var(--flowy-sidebar-row-height);
  padding: var(--flowy-space-2) var(--flowy-space-2);
  border-radius: var(--flowy-control-radius);
  color: var(--flowy-api-foreground);
  transition: var(--flowy-transition);
}

.scalar-app .references-rendered .parameter-item-trigger:hover,
.scalar-app .references-rendered .parameter-item-trigger:focus-visible {
  background: color-mix(in srgb, var(--flowy-api-primary) 8%, transparent);
}

.scalar-app .references-rendered .parameter-item-name {
  color: var(--flowy-api-code-blue);
  font-family: var(--scalar-font-code);
}

.scalar-app .references-rendered .parameter-item-description,
.scalar-app .references-rendered .parameter-item-description-summary {
  color: var(--flowy-api-muted);
}

.scalar-app .references-rendered .parameter-item-required-optional {
  color: var(--flowy-api-muted);
}

.scalar-app .references-rendered .parameter-item--required {
  color: var(--scalar-color-orange);
}

.scalar-app .references-rendered .parameter-item-container {
  padding: 0 var(--flowy-space-2) var(--flowy-space-2);
}

.scalar-app .references-rendered .operation-details .text-c-1 {
  color: var(--flowy-api-foreground);
  font-size: 16px;
  font-weight: 700;
}

.scalar-app .references-rendered .operation-details .parameter-item-container-markdown {
  color: var(--flowy-api-muted);
}

.scalar-app .references-rendered .badge {
  border: 1px solid var(--flowy-api-border);
  border-radius: var(--flowy-pill-radius);
  background: color-mix(in srgb, var(--flowy-api-primary) 10%, transparent);
  color: var(--flowy-api-primary-hover);
  font-family: var(--scalar-font-code);
  font-size: 11px;
  font-weight: 600;
}

.scalar-app .references-rendered .operation-details :is(ul, ol) {
  list-style: none;
  margin: 0;
  padding: 0;
}

.scalar-app .references-rendered .operation-details .parameter-item + .parameter-item {
  margin-top: 0;
}

.scalar-app .references-rendered .operation-details .schema-card,
.scalar-app .references-rendered .operation-details .property {
  border-color: var(--flowy-api-border);
}

.scalar-app .references-rendered .operation-details :is(.property-heading, .property-detail-value) {
  color: var(--flowy-api-foreground);
}

.scalar-app .references-rendered .operation-details .property-description {
  color: var(--flowy-api-muted);
}

.scalar-app .references-rendered .operation-details :is(.content-type-select, .selected-content-type) {
  border-color: var(--flowy-api-border);
  border-radius: var(--flowy-control-radius);
  background: var(--flowy-api-elevated);
  color: var(--flowy-api-primary-hover);
  font-family: var(--scalar-font-code);
  font-size: 12px;
}

.scalar-app .references-rendered .operation-details :is(.content-type-select, .selected-content-type):hover {
  border-color: var(--flowy-api-primary);
  background: color-mix(in srgb, var(--flowy-api-primary) 10%, var(--flowy-api-elevated));
}

.scalar-app .references-rendered .section:focus-visible,
.scalar-app .references-rendered .operation-layout:focus-visible {
  outline: 2px solid var(--flowy-api-primary);
  outline-offset: 6px;
}

.scalar-app .references-rendered .section > :is(.section-header-wrapper, .operation-layout) {
  min-width: 0;
}

.scalar-app .references-rendered .examples > * {
  min-width: 0;
}

@media (prefers-reduced-motion: reduce) {
  .scalar-app .references-rendered .parameter-item-trigger,
  .scalar-app .references-rendered .badge {
    transition: none;
  }
}

.scalar-app .references-rendered .request-card {
  overflow: hidden;
  border: 1px solid var(--flowy-api-border) !important;
  border-radius: var(--flowy-card-radius) !important;
  background: var(--flowy-api-card) !important;
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--flowy-api-border) 70%, transparent), 0 12px 28px color-mix(in srgb, var(--flowy-api-page) 48%, transparent) !important;
}

.scalar-app .references-rendered .request-card .scalar-card-header {
  min-height: 44px;
  padding: var(--flowy-space-2) var(--flowy-space-3);
  border-bottom: 1px solid var(--flowy-api-border) !important;
  background: var(--flowy-api-elevated) !important;
  color: var(--flowy-api-foreground) !important;
}

.scalar-app .references-rendered .request-card .request-method {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.scalar-app .references-rendered .request-card [data-testid="client-picker"] {
  min-height: 28px;
  padding: var(--flowy-space-1) var(--flowy-space-2);
  border: 1px solid var(--flowy-api-primary) !important;
  border-radius: 7px;
  background: color-mix(in srgb, var(--flowy-api-primary) 12%, var(--flowy-api-card)) !important;
  color: var(--flowy-api-primary-hover) !important;
  font-family: var(--scalar-font-code);
  font-size: 11px;
  font-weight: 600;
}

.scalar-app .references-rendered .request-card .request-editor-section,
.scalar-app .references-rendered .request-card .code-snippet,
.scalar-app .references-rendered .request-card .scalar-code-block,
.scalar-app .references-rendered .request-card .scalar-code-block > .custom-scroll {
  background: var(--flowy-api-page) !important;
  color: var(--flowy-api-foreground) !important;
}

.scalar-app .references-rendered .request-card .scalar-code-block {
  min-height: 118px;
  padding-block: var(--flowy-space-2);
  border-radius: 0;
}

.scalar-app .references-rendered .request-card .scalar-code-block pre {
  min-width: 100%;
  padding-inline: var(--flowy-space-3);
  background: transparent !important;
  color: var(--flowy-api-foreground) !important;
  font-size: 13px;
  line-height: 1.65;
  tab-size: 2;
}

.scalar-app .references-rendered .request-card .scalar-code-block code.hljs,
.scalar-app .references-rendered .request-card .scalar-code-block .hljs {
  background: transparent !important;
  color: var(--flowy-api-foreground) !important;
}

.scalar-app .references-rendered .request-card .scalar-code-block .hljs .line {
  display: block;
  min-height: 1.65em;
}

.scalar-app .references-rendered .request-card .scalar-code-block .hljs .line::before {
  color: var(--flowy-api-muted) !important;
  opacity: 1;
}

.scalar-app .references-rendered .request-card .scalar-code-block .hljs:is(.language-curl, .language-shell, .language-bash, .language-sh) .hljs-string {
  color: var(--flowy-api-code-blue) !important;
}

.scalar-app .references-rendered .request-card .scalar-code-block .hljs:is(.language-curl, .language-shell, .language-bash, .language-sh) :is(.hljs-built_in, .hljs-meta) {
  color: var(--flowy-api-primary-hover) !important;
  font-weight: 600;
}

.scalar-app .references-rendered .request-card .scalar-code-block .hljs:is(.language-curl, .language-shell, .language-bash, .language-sh) :is(.hljs-keyword, .hljs-number, .hljs-literal) {
  color: var(--flowy-api-code-purple) !important;
}

.scalar-app .references-rendered .request-card .scalar-code-block .hljs:is(.language-curl, .language-shell, .language-bash, .language-sh) .hljs-variable {
  color: var(--flowy-api-code-yellow) !important;
}

.scalar-app .references-rendered .request-card .scalar-code-block .hljs:is(.language-curl, .language-shell, .language-bash, .language-sh) .hljs-comment {
  color: var(--flowy-api-muted) !important;
  font-style: italic;
}

.scalar-app .references-rendered .request-card .scalar-code-copy {
  border: 1px solid var(--flowy-api-border) !important;
  border-radius: 6px;
  background: var(--flowy-api-elevated) !important;
  color: var(--flowy-api-primary-hover) !important;
}

.scalar-app .references-rendered .request-card .request-card-footer {
  min-height: 42px;
  padding: var(--flowy-space-2);
  border-top: 1px solid var(--flowy-api-border) !important;
  background: var(--flowy-api-elevated) !important;
}

.scalar-app .references-rendered .request-card .show-api-client-button {
  min-height: 28px;
  padding: var(--flowy-space-1) 10px;
  border: 1px solid var(--flowy-api-primary) !important;
  border-radius: 7px;
  background: var(--flowy-api-primary) !important;
  color: var(--flowy-api-page) !important;
  font-size: 11px;
  font-weight: 650;
}

.scalar-app .references-rendered .request-card .show-api-client-button:hover {
  border-color: var(--flowy-api-primary-hover);
  background: var(--flowy-api-primary-hover) !important;
}

.scalar-app .references-rendered .request-card::before,
.scalar-app .references-rendered .request-card::after {
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.flowy-docs-shell {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  overflow-x: clip;
  background: var(--flowy-api-page);
}

.flowy-docs-header {
  position: sticky;
  top: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--flowy-space-4);
  width: 100%;
  height: var(--flowy-header-height);
  padding: 0 20px;
  box-sizing: border-box;
  isolation: isolate;
  border-bottom: 1px solid var(--flowy-api-border);
  background: color-mix(in srgb, var(--flowy-api-page) 94%, transparent);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--flowy-api-primary) 8%, transparent), var(--scalar-shadow-1);
  color: var(--flowy-api-foreground);
  font-family: var(--scalar-font);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.flowy-docs-brand {
  display: inline-flex;
  flex: 0 1 auto;
  align-items: center;
  min-width: 0;
  gap: 10px;
  color: inherit !important;
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
  text-decoration: none !important;
  white-space: nowrap;
}

.flowy-docs-brand img {
  flex: 0 0 auto;
  width: 32px;
  height: 32px;
  border: 1px solid color-mix(in srgb, var(--flowy-api-primary) 28%, var(--flowy-api-border));
  border-radius: var(--flowy-control-radius);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--flowy-api-page) 40%, transparent);
}

.flowy-docs-brand span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.flowy-docs-brand:hover {
  color: var(--flowy-api-foreground) !important;
}

.flowy-docs-nav {
  display: flex;
  flex: 0 1 auto;
  align-items: stretch;
  align-self: stretch;
  min-width: 0;
  gap: var(--flowy-space-4);
  margin-left: auto;
}

.flowy-docs-nav a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 2px;
  border: 0;
  color: var(--flowy-api-muted) !important;
  font-size: 13px;
  line-height: 1.2;
  text-decoration: none !important;
  text-underline-offset: 4px;
  text-decoration-thickness: 1px;
  transition: color 140ms ease, text-decoration-color 140ms ease;
  white-space: nowrap;
}

.flowy-docs-nav a:hover {
  background: transparent;
  color: var(--flowy-api-foreground) !important;
  text-decoration: underline !important;
  text-decoration-color: var(--flowy-api-primary-hover);
}

.flowy-docs-nav a[aria-current="page"] {
  background: transparent;
  color: var(--flowy-api-primary-hover) !important;
  font-weight: 650;
  text-decoration: underline !important;
  text-decoration-color: var(--flowy-api-primary);
}

.flowy-docs-nav a[aria-current="page"]:hover {
  background: transparent;
  color: var(--flowy-api-foreground) !important;
}

.flowy-docs-nav a:visited {
  color: var(--flowy-api-muted) !important;
}

.flowy-docs-nav a[aria-current="page"]:visited {
  color: var(--flowy-api-primary-hover) !important;
}

.flowy-docs-nav a:focus-visible,
.flowy-docs-brand:focus-visible {
  outline: 2px solid var(--flowy-api-primary);
  outline-offset: 2px;
}

.flowy-docs-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--flowy-space-4);
  min-height: 52px;
  padding: var(--flowy-space-3) 20px;
  box-sizing: border-box;
  border-top: 1px solid var(--flowy-api-border);
  background: var(--flowy-api-page);
  color: var(--flowy-api-muted);
  font-size: 12px;
  font-family: var(--scalar-font);
}

.flowy-docs-footer nav {
  display: flex;
  gap: var(--flowy-space-4);
}

.flowy-docs-footer a {
  color: var(--flowy-api-muted) !important;
  text-decoration: none !important;
}

.flowy-docs-footer a:hover {
  color: var(--flowy-api-foreground) !important;
  text-decoration: underline !important;
}

@media (max-width: 640px) {
  :root {
    --flowy-header-height: 56px;
  }

  .flowy-docs-header {
    gap: var(--flowy-space-2);
    padding: 0 14px;
  }

  .flowy-docs-brand {
    font-size: 14px;
  }

  .flowy-docs-brand img {
    width: 28px;
    height: 28px;
  }

  .flowy-docs-nav {
    gap: var(--flowy-space-3);
  }

  .flowy-docs-nav a {
    min-height: 44px;
    padding-inline: 2px;
    font-size: 12px;
  }

  .flowy-docs-nav a:first-child,
  .flowy-docs-nav a[href="/openapi.json"] {
    display: none;
  }

  .flowy-docs-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}

/* Content and component styling: keep Scalar's structure intact while applying
   Flowy surfaces, readable spacing, responsive sizing, and accessible states. */
.scalar-app .references-rendered .introduction-section .sticky-cards {
  min-width: 0;
}

.scalar-app .references-rendered .introduction-card,
.scalar-app .references-rendered .introduction-card-row,
.scalar-app .references-rendered .introduction-card-item {
  min-width: 0;
}

.scalar-app .references-rendered .introduction-card-item > .scalar-card {
  border-color: var(--flowy-api-border) !important;
  border-radius: var(--flowy-card-radius) !important;
  background: var(--flowy-api-card) !important;
  box-shadow: var(--scalar-shadow-1) !important;
}

.scalar-app .references-rendered .introduction-card-item .scalar-card-header {
  border-color: var(--flowy-api-border) !important;
  background: var(--flowy-api-elevated) !important;
  color: var(--flowy-api-foreground) !important;
}

.scalar-app .references-rendered .introduction-card-item .scalar-card-content {
  background: var(--flowy-api-card) !important;
  color: var(--flowy-api-foreground);
}

.scalar-app .references-rendered .introduction-card-item :is(.server-form-container, .request-item) {
  border-color: var(--flowy-api-border) !important;
  background: var(--flowy-api-card) !important;
}

.scalar-app .references-rendered .introduction-card-item :is(.server-url, .server-description, .description) {
  max-width: 100%;
  overflow-wrap: anywhere;
}

.scalar-app .references-rendered .introduction-card-item .security-scheme-label {
  color: var(--flowy-api-primary-hover) !important;
  font-family: var(--scalar-font-code);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.scalar-app .references-rendered .introduction-card-item :is(input, select, textarea) {
  max-width: 100%;
  border-color: var(--flowy-api-border) !important;
  border-radius: var(--flowy-control-radius);
  background: var(--flowy-api-elevated) !important;
  color: var(--flowy-api-foreground) !important;
}

.scalar-app .references-rendered .introduction-card-item :is(input, select, textarea):focus {
  border-color: var(--flowy-api-primary) !important;
  box-shadow: var(--flowy-focus-ring) !important;
}

.scalar-app .references-rendered .introduction-card-item :is(button, [role="button"]):hover {
  border-color: var(--flowy-api-primary) !important;
  background: color-mix(in srgb, var(--flowy-api-primary) 12%, var(--flowy-api-elevated)) !important;
}

/* Bearer token control: target Scalar's actual token placeholder so the
   auth field stays readable and usable without changing the card layout. */
.scalar-app .references-rendered .introduction-card-item:has(input[placeholder="Token"]) {
  min-width: 0;
}

.scalar-app .references-rendered .introduction-card-item input[placeholder="Token"] {
  width: auto;
  min-width: 0;
  max-width: 100%;
  flex: 1 1 0;
  box-sizing: border-box;
  height: var(--flowy-control-height);
  padding: 0 var(--flowy-space-3);
  border: 1px solid var(--flowy-api-border) !important;
  border-radius: var(--flowy-control-radius) 0 0 var(--flowy-control-radius);
  background: var(--flowy-api-page) !important;
  color: var(--flowy-api-foreground) !important;
  font-family: var(--scalar-font-code);
  font-size: 13px;
  line-height: var(--flowy-control-height);
  outline: none;
}

.scalar-app .references-rendered .introduction-card-item input[placeholder="Token"]::placeholder {
  color: var(--flowy-api-muted) !important;
  opacity: 1;
}

.scalar-app .references-rendered .introduction-card-item input[placeholder="Token"]:focus {
  border-color: var(--flowy-api-primary) !important;
  box-shadow: var(--flowy-focus-ring) !important;
}

.scalar-app .references-rendered .introduction-card-item input[placeholder="Token"] + button,
.scalar-app .references-rendered .introduction-card-item input[placeholder="Token"] + [role="button"] {
  flex: 0 0 36px;
  width: 36px;
  max-width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--flowy-api-border) !important;
  border-left: 0 !important;
  border-radius: 0 var(--flowy-control-radius) var(--flowy-control-radius) 0;
  background: var(--flowy-api-page) !important;
  color: var(--flowy-api-muted) !important;
}

.scalar-app .references-rendered .introduction-card-item input[placeholder="Token"] + button:hover,
.scalar-app .references-rendered .introduction-card-item input[placeholder="Token"] + [role="button"]:hover {
  background: var(--flowy-api-elevated) !important;
  color: var(--flowy-api-primary-hover) !important;
}

/* Operation chrome */
.scalar-app .references-rendered :is(.operation-header, .operation-summary, .operation-path) {
  min-width: 0;
}

.scalar-app .references-rendered .operation-header {
  margin-bottom: var(--flowy-space-3);
}

.scalar-app .references-rendered :is(.operation-path, .path) {
  overflow-wrap: anywhere;
  color: var(--flowy-api-primary-hover);
  font-family: var(--scalar-font-code);
  font-size: 13px;
  line-height: 1.5;
}

.scalar-app .references-rendered :is(.operation-summary, .operation-description) {
  min-width: 0;
}

.scalar-app .references-rendered .operation-summary {
  color: var(--flowy-api-foreground);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
}

.scalar-app .references-rendered :is(.http-method, .operation-method) {
  flex: 0 0 auto;
  min-width: 44px;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--flowy-api-primary) 38%, var(--flowy-api-border));
  border-radius: var(--flowy-pill-radius);
  background: color-mix(in srgb, var(--flowy-api-primary) 12%, transparent);
  color: var(--flowy-api-primary-hover);
  font-family: var(--scalar-font-code);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.scalar-app .references-rendered :is(.operation-auth, .operation-id, .operation-deprecated) {
  border: 1px solid var(--flowy-api-border);
  border-radius: var(--flowy-pill-radius);
  background: var(--flowy-api-elevated);
  color: var(--flowy-api-muted);
  font-size: 11px;
}

/* Response states */
.scalar-app .references-rendered :is(.responses, .response-list) {
  display: flex;
  flex-direction: column;
  gap: var(--flowy-space-3);
}

.scalar-app .references-rendered :is(.response, .response-card) {
  overflow: hidden;
  border: 1px solid var(--flowy-api-border) !important;
  border-radius: var(--flowy-card-radius) !important;
  background: var(--flowy-api-card) !important;
  box-shadow: var(--scalar-shadow-1) !important;
}

.scalar-app .references-rendered :is(.response-header, .response-card-header) {
  display: flex;
  align-items: baseline;
  gap: var(--flowy-space-2);
  min-height: 40px;
  padding: var(--flowy-space-2) var(--flowy-space-3);
  border-bottom: 1px solid var(--flowy-api-border) !important;
  background: var(--flowy-api-elevated) !important;
}

.scalar-app .references-rendered :is(.response-status, .response-status-code, .status-code) {
  min-width: 34px;
  color: var(--flowy-api-primary-hover) !important;
  font-family: var(--scalar-font-code);
  font-size: 12px;
  font-weight: 700;
}

.scalar-app .references-rendered :is(.response-description, .response-card-description) {
  min-width: 0;
  color: var(--flowy-api-muted);
  font-size: 13px;
  line-height: 1.5;
}

.scalar-app .references-rendered :is(.response-content, .response-card-content, .response-body) {
  min-width: 0;
  background: var(--flowy-api-page) !important;
}

.scalar-app .references-rendered :is(.response-headers, .response-header-list, .headers-properties) {
  border-top: 1px solid var(--flowy-api-border);
  background: var(--flowy-api-card);
}

.scalar-app .references-rendered :is(.response-headers, .response-header-list) :is(dt, .header-name, .property-name) {
  color: var(--flowy-api-code-blue);
  font-family: var(--scalar-font-code);
  font-size: 12px;
}

.scalar-app .references-rendered :is(.response-headers, .response-header-list) :is(dd, .header-description, .property-description) {
  color: var(--flowy-api-muted);
  font-size: 12px;
}

.scalar-app .references-rendered :is(.response-card, .response) :is(.empty-state, .no-response) {
  min-height: 56px;
  margin: 0;
  padding: var(--flowy-space-4);
  color: var(--flowy-api-muted);
  text-align: center;
}

/* Models and nested schemas */
.scalar-app .references-rendered :is(.models, .model, .reference-models, .collapsible-section) {
  min-width: 0;
}

.scalar-app .references-rendered :is(.model, .schema-card, .collapsible-section) {
  border-color: var(--flowy-api-border) !important;
}

.scalar-app .references-rendered .collapsible-section {
  margin-block: var(--flowy-space-2);
  border-top: 1px solid var(--flowy-api-border);
}

.scalar-app .references-rendered .collapsible-section-trigger {
  width: 100%;
  min-height: 40px;
  padding: var(--flowy-space-2) var(--flowy-space-3);
  border-radius: var(--flowy-control-radius);
  color: var(--flowy-api-foreground);
  transition: var(--flowy-transition);
}

.scalar-app .references-rendered .collapsible-section-trigger:hover,
.scalar-app .references-rendered .collapsible-section-trigger-open {
  background: color-mix(in srgb, var(--flowy-api-primary) 8%, transparent);
}

.scalar-app .references-rendered :is(.reference-models-anchor, .reference-models-label, .schema-card-title) {
  min-width: 0;
  color: var(--flowy-api-foreground) !important;
  font-weight: 700;
}

.scalar-app .references-rendered :is(.schema-card, .schema-properties) {
  min-width: 0;
  border-color: var(--flowy-api-border) !important;
  background: var(--flowy-api-card);
}

.scalar-app .references-rendered .schema-card-description {
  padding: var(--flowy-space-3);
  color: var(--flowy-api-muted);
  line-height: 1.55;
}

.scalar-app .references-rendered :is(.property, .schema-property) {
  min-width: 0;
  padding: var(--flowy-space-3);
  border-bottom-color: var(--flowy-api-border) !important;
  background: transparent;
}

.scalar-app .references-rendered :is(.property, .schema-property):hover {
  background: color-mix(in srgb, var(--flowy-api-primary) 5%, transparent);
}

.scalar-app .references-rendered :is(.property-name, .property-name-pattern-properties, .property-name-additional-properties) {
  color: var(--flowy-api-code-blue) !important;
  font-family: var(--scalar-font-code);
  font-size: 12px;
  font-weight: 600;
}

.scalar-app .references-rendered :is(.schema-type, .property-type, .type) {
  display: inline-flex;
  max-width: 100%;
  overflow-wrap: anywhere;
  border: 1px solid color-mix(in srgb, var(--flowy-api-primary) 28%, var(--flowy-api-border));
  border-radius: var(--flowy-pill-radius);
  background: color-mix(in srgb, var(--flowy-api-primary) 9%, transparent);
  color: var(--flowy-api-primary-hover) !important;
  font-family: var(--scalar-font-code);
  font-size: 11px;
  line-height: 1.4;
}

.scalar-app .references-rendered :is(.property-description, .schema-card-description) {
  color: var(--flowy-api-muted) !important;
  font-size: 13px;
}

.scalar-app .references-rendered :is(.property-required, .required, .schema-required) {
  color: var(--scalar-color-orange) !important;
  font-size: 11px;
  font-weight: 700;
}

.scalar-app .references-rendered :is(.schema-enums, .enum, .enum-values) {
  display: flex;
  flex-wrap: wrap;
  gap: var(--flowy-space-1);
  margin-top: var(--flowy-space-2);
}

.scalar-app .references-rendered :is(.schema-enums, .enum, .enum-values) > * {
  border: 1px solid color-mix(in srgb, var(--flowy-api-primary) 24%, var(--flowy-api-border));
  border-radius: 5px;
  background: var(--flowy-api-elevated);
  color: var(--flowy-api-code-purple);
  font-family: var(--scalar-font-code);
  font-size: 11px;
}

.scalar-app .references-rendered :is(.property-rule, .property-example-value, .composition-panel) {
  border-color: var(--flowy-api-border) !important;
  background: var(--flowy-api-page);
}

/* Shared content safeguards */
.scalar-app .references-rendered :is(.section-header, .operation-title, .schema-card-title) {
  max-width: 100%;
  overflow-wrap: anywhere;
  text-wrap: balance;
}

.scalar-app .references-rendered :is(.markdown, .operation-description) :is(img, svg) {
  max-width: 100%;
  height: auto;
}

.scalar-app .references-rendered :is(.operation-layout, .section-content, .section-column, .examples, .sticky-cards) {
  min-width: 0;
}

.scalar-app :is(button, input, select, textarea, [role="button"]):disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Small screens: let the content and example column breathe instead of
   forcing fixed widths from Scalar's desktop layout. */
@container narrow-references-container (max-width: 900px) {
  .scalar-app .references-rendered .introduction-card-row {
    flex-direction: column;
    gap: var(--flowy-space-3);
  }

  .scalar-app .references-rendered .operation-layout {
    grid-template-columns: minmax(0, 1fr);
    row-gap: var(--flowy-space-4);
  }
}

@media (max-width: 900px) {
  .scalar-app .references-rendered .section {
    padding: 40px 24px;
  }

  .scalar-app .references-rendered .section:first-child {
    padding-top: 28px;
  }

  .scalar-app .references-rendered .operation-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 600px) {
  .scalar-app .references-rendered .section {
    padding: 32px 16px;
  }

  .scalar-app .references-rendered .operation-title {
    font-size: 20px;
  }

  .scalar-app .references-rendered :is(.property, .schema-property) {
    padding-inline: var(--flowy-space-2);
  }

  .scalar-app .references-rendered .introduction-card-item .scalar-card-header {
    padding-inline: var(--flowy-space-2);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar .sidebar-heading-type,
  .scalar-app .request-card .show-api-client-button,
  .scalar-app .references-rendered .collapsible-section-trigger {
    transition: none;
  }
}
`;

const config = {
  url: "/openapi.json",
  cdn: SCALAR_CDN,
  pageTitle: "Flowy API Reference",
  theme: "none" as const,
  darkMode: true,
  layout: "modern" as const,
  showSidebar: true,
  hideSearch: false,
  showOperationId: false,
  modelsSectionLabel: "Models",
  documentDownloadType: "json" as const,
  defaultOpenFirstTag: false,
  defaultOpenAllTags: false,
  expandAllResponses: true,
  expandAllModelSections: false,
  expandAllSchemaProperties: false,
  operationTitleSource: "summary" as const,
  tagsSorter: "alpha" as const,
  operationsSorter: "method" as const,
  orderSchemaPropertiesBy: "preserve" as const,
  orderRequiredPropertiesFirst: true,
  hideClientButton: true,
  hideDarkModeToggle: false,
  showDeveloperTools: "never" as const,
  defaultHttpClient: { targetKey: "shell", clientKey: "curl" } as const,
  hiddenClients: {
    c: false,
    ruby: false,
    node: false,
    php: false,
    python: false,
    shell: false,
    csharp: true,
    clojure: true,
    dart: true,
    fsharp: true,
    go: true,
    http: true,
    java: true,
    javascript: true,
    kotlin: true,
    objc: true,
    ocaml: true,
    powershell: true,
    r: true,
    rust: true,
    swift: true,
  },
  persistAuth: true,
  authentication: {
    preferredSecurityScheme: "bearerAuth",
  },
  agent: {
    disabled: true,
  },
  mcp: {
    disabled: true,
  },
  customCss: FLOWY_DOCS_CSS,
};

export async function GET() {
  const scalarResponse = ApiReference(config)();
  const html = await scalarResponse.text();
  const version = "1.0.0";

  const header = `<header class="flowy-docs-header">
    <a class="flowy-docs-brand" href="/" aria-label="Flowy home">
      <img src="/app-icon.svg" alt="" width="32" height="32" />
      <span>Flowy API</span>
    </a>
    <nav class="flowy-docs-nav" aria-label="API documentation links">
      <a href="/api/docs" aria-current="page">Reference</a>
      <a href="/openapi.json">Raw OpenAPI</a>
      <a href="${REPO_URL}" target="_blank" rel="noreferrer">GitHub</a>
    </nav>
  </header>`;

  const footer = `<footer class="flowy-docs-footer">
    <span>Flowy API · OpenAPI v${version}</span>
    <nav aria-label="Footer links">
      <a href="/openapi.json">Raw OpenAPI</a>
      <a href="${REPO_URL}" target="_blank" rel="noreferrer">GitHub</a>
    </nav>
  </footer>`;

  const brandedHtml = html
    .replace("<html>", '<html lang="en">')
    .replace(
      "</head>",
      `    <meta name="description" content="Flowy API reference — transactions, budgets, goals, subscriptions, spaces and more." />
    <meta name="theme-color" content="#020617" />
    <meta property="og:title" content="Flowy API Reference" />
    <meta property="og:description" content="Interactive reference for the Flowy REST API." />
    <meta property="og:image" content="https://flowy-jade.vercel.app/app-icon.svg" />
    <link rel="icon" href="/app-icon.svg" />
  </head>`,
    )
    .replace(
      '<div id="app"></div>',
      `<div class="flowy-docs-shell">${header}<div id="app"></div>${footer}</div>`,
    );

  return new Response(brandedHtml, {
    status: scalarResponse.status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
