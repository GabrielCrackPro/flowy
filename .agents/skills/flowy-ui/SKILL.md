---
name: flowy-ui
description: Flowy's design system — tokens, surfaces, controls, mobile/PWA patterns, and shared components. Use when building or restyling UI so new work matches the existing design language instead of introducing new patterns.
---

# Flowy UI / UX Design System

Flowy is a personal-finance PWA. The UI language is **quiet, flat, and native-feeling**: solid card surfaces, hairline borders, restrained color accents, and consistent mobile chrome (bottom nav + bottom sheets). This document is the source of truth for how the app looks and behaves. **Prefer editing the shared components below over re-implementing styles inline.**

---

## 1. Design tokens (`src/app/globals.css`)

- Surfaces are defined as HSL tokens: `--background` (canvas), `--card` (surface), `--popover`, `--border`, `--muted`, `--primary`, `--foreground`, `--destructive`.
- Light: `--background: 210 40% 97%`, `--card: 0 0% 100%`, `--border: 214.3 25% 88%`, `--primary: 221.2 83.2% 53.3%`.
- Dark: `--background: 222 47% 7%`, `--card: 222 38% 11%`, `--border: 217.2 24% 23%`, `--primary: 217.2 91.2% 62%`.
- Radii: `--radius: 0.75rem`; cards use `rounded-xl`/`rounded-2xl`, sheets use `rounded-t-3xl` on mobile.
- Elevation comes from borders and shadows only where intentional — **sheet surfaces and nav chrome are flat (no shadows)**. Shadows are reserved for floating elements (FAB, action bubbles, popovers) and interactive hover states.
- Theme is overridable by the user (custom primary/secondary/accent). **Never hardcode raw hex colors**; always use tokens (`bg-primary`, `text-muted-foreground`, `border-border`) or tinted token classes (`bg-primary/10`, `border-primary/20`).

## 2. Core surfaces

### Cards (`src/components/shared/card-tokens.ts`)
Use `CARD_SHELL` / `CARD_ICON_TILE` / `CARD_CONTENT` tokens for entity cards:

```tsx
<article className={cn(CARD_SHELL, className)}>
  <div className={CARD_ICON_TILE}><Icon icon={Icon} className="size-5" /></div>
  <div className={CARD_CONTENT}>…</div>
</article>
```

Card anatomy: `rounded-2xl border border-border/60 bg-card`, soft `--shadow-card`, hover lifts `-translate-y-0.5` + `--shadow-card-hover`. Icons sit in tinted tiles (`bg-primary/10 text-primary ring-1 ring-inset ring-primary/10`).

### Stat / summary cards (`summary-metric-card.tsx`, `stats-card.tsx`)
Keep 2–4 per row; each shows an icon tile, label, and value. Tones use tinted tokens (e.g. `tone="positive"` → emerald tints, `"warning"` → amber, `"info"` → primary/blue). Icons per entity:

| Entity | Icon | Tint |
| --- | --- | --- |
| Transaction | `ArrowUpDown` | primary blue |
| Budget | `Wallet` | amber |
| Goal | `Target` | emerald |
| Subscription | `Repeat2` / `CreditCard` | violet |
| Category | `Tag` | orange |

### Toolbars (`src/components/shared/action-bar.tsx`)
- `ActionBar` is the shared toolbar: search left, actions right; wraps on mobile.
- Use `buildFinanceListActionBar({ create, exportAction, filterAction, refresh })` on entity list pages — it centralizes create/refresh wiring.
- Mobile icon buttons: `size-10 rounded-xl`; desktop `size-9`. Only the **filter** button keeps a label on mobile; other header buttons are icon-only.

## 3. Controls (`src/components/ui/control-styles.ts`)

Reuse these tokens so every input/select/option looks the same:

```ts
CONTROL_SURFACE   // base: rounded-xl border border-border/50 bg-background/80 shadow-sm
CONTROL_FOCUS     // focus: border-primary/50 ring-3 ring-primary/15
CONTROL_DISABLED
SELECTOR_CONTROL  // trigger: min-h-11, px-3, whitespace-nowrap
OPTION_ROW_BASE   // dropdown rows: min-h-10, rounded-lg, px-2.5
OPTION_ROW_INTERACTION
OPTION_ROW_SELECTED  // bg-primary/10 text-primary font-medium
```

Rules:
- Labels are **left-aligned**, never centered.
- Selectors carry icons (field icon + option icon when the entity has one).
- Triggers are `min-h-11` on mobile, `min-h-10`/`h-9` on desktop; dropdown rows `min-h-10` touch targets.
- Checkmarks / selected states use `border-primary bg-primary text-primary-foreground`.
- Never trim option text unless necessary — allow wrapping (`break-words` in option rows).

## 4. Sheets (`src/components/ui/sheet.tsx`)

- **Every sheet becomes a bottom sheet on mobile automatically** (`SheetContent` uses `useIsMobile`). Callers pass the desktop side (`side="right"` for forms/details) and get the mobile treatment for free: full-width, `max-h-[92dvh]`, `rounded-t-3xl`, drag handle + swipe-down dismissal.
- Mobile bottom sheets open from the bottom (spring/cubic-bezier), desktop side sheets slide in from their side. Respect `prefers-reduced-motion` (framer-motion `useReducedMotion`).
- **No shadows on sheet surfaces** — separation comes from `bg-background`, `border`, and the `bg-black/60 backdrop-blur-sm` overlay.
- Use the shared shell components:
  - `EntitySheetHeader` (`entity-sheet/entity-sheet-header.tsx`) — icon tile, title, muted subtitle, metadata row, close button. Sticky, blurred.
  - `SheetActionFooter` (`entity-sheet/sheet-action-footer.tsx`) — sticky footer with safe-area padding; mobile stacks primary above secondary (`flex-col-reverse`), desktop lays out `start`/`end`.
  - `EntitySheetFooter` — cancel (ghost) + submit (primary, dominant on mobile).
  - `BottomSheet` — the shared mobile sheet wrapper (header + scroll area + footer).
- Form sheets (budget/goal/subscription/category/new-transaction) should reuse `EntitySheetHeader` + `EntitySheetFooter` + `FormSection` + `PreviewCard` — **do not hand-roll a new header/footer**.

## 5. Mobile chrome (identical for browser tab and installed PWA)

### Bottom nav (`pwa-bottom-nav.tsx`)
- Solid `bg-card`, `border-t border-border/70`, **no shadow**, `pb-[env(safe-area-inset-bottom)]`.
- Icon-only tabs (`size-[19px]` icons in `size-10` slots), active = `bg-primary/12 text-primary`; **no visible labels**.
- Overflow destinations (subscriptions, categories) live in the **More** popover.
- Profile tab: tap navigates, **long-press opens quick actions** (profile → preferences, theme, sign out). Tap-versus-long-press is handled by the reusable `usePressAndHold` hook — use it for any new press-and-hold affordance.
- The bar hides on scroll down and reappears on scroll up (never while a menu/sheet is open).

### Floating action button (`pwa-fab.tsx`)
- Dashboard-only, `z-[45]` (below sheets at `z-50`), sits `bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+1rem)]`.
- Tap opens a **speed dial** of entity actions (transaction, budget, goal, subscription, category) with staggered springs; plus icon flips to X and the button turns destructive while open. Actions open their form in a bottom sheet (no navigation).
- The FAB is a `motion.button` with `size-14 rounded-full` gradient primary; keep elevation via shadow — this is a floating element, shadows are allowed here.

### Header (`dashboard/header/Header.tsx`)
- `sticky top-0 z-40 border-b border-border/70 bg-card` — flat, no shadow, no blur.
- Mobile: logo (mark only) + compact space switcher left, search / sync / theme icons right.
- Dashboard greeting shows only the user's **first name** (`getFirstName`).

### Toasts (`ui/sonner.tsx`, `shared/toast.tsx`)
- Mobile: bottom-centered compact cards **above the bottom nav** (`bottom: calc(4rem + env(safe-area-inset-bottom, 0px) + 1rem)`); max-width ~22rem.
- Desktop: standard top positioning.

## 6. Pages & lists

- Finance list pages follow one shape: `FinancePageShell` → `BackHeader` → description → summary cards → `EntityListView` (search + view toggle + action bar + grid/table).
- `EntityListView` owns search, skeleton, empty state, and grid/table switching. Cards are passed via `renderCard`.
- Exports go through `DataExportMenu` (`data-export-menu.tsx`): pass `data`, `columns`, `totals`, `title`, `filenamePrefix`, `locale`. CSV/PDF labels and success/error toasts are centralized — **do not re-pass them**.
- Mobile list headers: header action buttons are icon-only except the filter button.

## 7. Motion

- Framer Motion is the standard. Micro-interactions: card hover lift, icon spring on press (`whileTap={{ scale: 0.95 }}`), staggered entrances for menus/action bubbles.
- Entrances: subtle `opacity 0 → 1` with `y: 4–10px`, 0.15–0.4s, `easeOut` or springs (`stiffness` 300–520).
- **Always respect `prefers-reduced-motion`** (`useReducedMotion()` → zero-duration transitions or no animation).
- Theme switch uses a view transition with `--theme-x/--theme-y` clip reveal (see `globals.css`).

## 8. Non-negotiables

1. **No hardcoded user-facing strings** — add to both `src/lib/i18n/locales/en.ts` and `es.ts` and type them in `types.ts`.
2. **Reuse shared components** (`ActionBar`, `EntitySheetHeader/Footer`, `SheetActionFooter`, `BottomSheet`, `DataExportMenu`, `control-styles.ts`) instead of restyling inline.
3. **Flat sheet/nav surfaces** — no shadows on sheet content or nav bars.
4. Mobile and desktop must stay consistent: use `useIsMobile` + `sm:`/`md:` variants for responsive behavior; both mobile browsers and PWAs share the same chrome.
5. Touch targets ≥ 44px on mobile (`min-h-11` rows, `size-10` icon buttons); keyboard focus rings use `focus-visible:ring-2 ring-primary/30-40`.
6. Accessible labels: every icon-only control needs `aria-label`/`title`; dynamic surfaces (sheets, menus, dialogs) get proper `aria-*` roles and ids.
7. When building a new finance entity page/sheet, mirror an existing one (e.g. goals page + `goal-form-dialog.tsx`) end-to-end — API hooks, `useEntityFormModal`, `EntityListView`, form sheet, confirm dialog.
