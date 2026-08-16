// Icon → label spacing shared by every select-style trigger, filter button,
// and dropdown option row. Prefer this over a literal `gap-2` so new select
// variants can't drift apart.
export const CONTROL_ICON_GAP = "gap-2";

// Muted color for placeholder / empty values in select-style controls.
// base-ui Select exposes emptiness via the `data-placeholder` attribute, while
// date/category selectors and filter buttons apply this conditionally in JS —
// both resolve to this same token.
export const CONTROL_PLACEHOLDER = "text-muted-foreground";

// Native <input>/<textarea> ::placeholder — same muted color as the select
// placeholder token so text fields and selects match side by side in forms.
export const INPUT_PLACEHOLDER = `placeholder:${CONTROL_PLACEHOLDER}`;

export const CONTROL_SURFACE =
  "rounded-xl border border-border/50 bg-background/80 text-foreground shadow-sm transition duration-200 outline-none";

export const CONTROL_FOCUS =
  "focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-primary/15";

export const CONTROL_DISABLED =
  "disabled:cursor-not-allowed disabled:bg-muted/30 disabled:opacity-60";

// Shared form-field label typography (FormLabel, FormField, FormSection).
// One line-height source of truth so auth and dashboard labels stay in rhythm.
export const FIELD_LABEL = "text-sm font-medium text-foreground";

export const SELECTOR_CONTROL = `inline-flex min-h-11 items-center justify-between ${CONTROL_ICON_GAP} px-3 text-sm font-medium whitespace-nowrap`;

export const COMPACT_SELECTOR_CONTROL = `inline-flex min-h-10 items-center justify-between ${CONTROL_ICON_GAP} px-3 text-sm font-medium whitespace-nowrap`;

export const OPTION_ROW_BASE = `relative flex min-h-10 w-full items-center ${CONTROL_ICON_GAP} rounded-lg px-2.5 py-2 text-sm outline-none transition`;

export const OPTION_ROW_INTERACTION =
  "hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/30";

export const OPTION_ROW_SELECTED = "bg-primary/10 font-medium text-primary";
