# Auth improvement plan — OAuth, OTP & MFA

> Status: Phases 0–4 implemented locally; passwordless email is deferred until email delivery is configured.
> Scope: explore current Supabase Auth integration, fix critical auth bugs, add OAuth, defer email OTP, and implement free-plan TOTP MFA.
> Stack: Next.js 16 App Router · Supabase Auth (PKCE flow, `@supabase/ssr`) · i18n en/es.

## Current auth architecture

- **Clients**
  - `src/lib/supabase/client.ts` — browser client (`createBrowserClient`), PKCE, `remember-me` session-cookie handling.
  - `src/lib/supabase/server.ts` — SSR cookie client (`createServerClient`).
  - `src/lib/supabase/admin.ts` — service-role client (server-only).
  - `src/lib/auth/user.ts` — validates the current user for server-rendered pages and API routes.
- **Guards**
  - `middleware.ts` — protects routes with `supabase.auth.getUser()` (JWT-validating, per the `nextjs-supabase-auth` skill; never `getSession()` for protection).
  - `src/lib/api/route-utils.ts` — `requireAuth()` / `requireAdmin()` for API routes.
- **Client state**: `src/hooks/useAuth.ts` — seeds from `getSession()`, subscribes to `onAuthStateChange`.
- **Wrappers**: `src/lib/supabase/auth.ts` for primary auth and `src/lib/supabase/mfa.ts` for TOTP enrollment/challenge/verification/factor management.
- **Pages**: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/mfa`, and `/auth/callback` (route handler).

## Critical findings (ordered by severity)

1. **P0 — Middleware breaks every code-redirect flow.**
   `AUTH_PATHS` in `middleware.ts` only lists `/auth/login`, `/auth/register`, `/auth/forgot`. When Supabase redirects back to `/auth/callback?code=...`, the user has **no session yet** (the code hasn't been exchanged), so middleware redirects to `/auth/login` and **drops the `code`**. The callback route never runs.
   - Impact: **OAuth is non-functional**, and **email confirmation** and **forgot-password** links land nowhere (the callback is the `emailRedirectTo` for signup, recovery, and magic links).
   - Fix: treat all `/auth/*` paths as public in middleware, or add `/auth/callback` to `AUTH_PATHS`.

2. **P0 — Open redirect in the callback.**
   `next` in `src/app/auth/callback/route.ts` is taken from the URL and trusted: `?next=https://evil.com` redirects there. Validate it's an internal path (starts with `/`, not `//`, no `http`).

3. **P1 — No password-recovery completion page.**
   The callback doesn't branch on `type` (`recovery`, `magiclink`, `signup`), and there is no "set new password" page. Today the user never reaches the recovery link; even if the callback ran, they'd be dumped on `/dashboard`.

4. **P1 — OAuth is not wired up.**
   - No OAuth UI on login/register (helpers exist but nothing renders them).
   - Provider types drifted: `useAuth` allows `"google" | "apple" | "github"`, `src/lib/supabase/auth.ts` only `"google" | "apple"`.
   - `useAuth` re-implements wrapper functions directly against `supabase.auth.*` instead of delegating.
   - `signInWithOAuth` doesn't pass `options.data` (currency/locale/full_name), so OAuth signups get default prefs instead of the detected ones.

5. **P1 — No OTP / magic-link support.**
   Supabase natively supports `signInWithOtp` (magic link or 6-digit code) + `verifyOtp`; none of it is used.

6. **P2 — Raw Supabase error strings.**
   `error.message` is shown directly to users (English, inconsistent with the app's i18n; many service strings are hardcoded Spanish). New auth flows should map Supabase error codes to i18n keys.

7. **P2 — No auth rate limiting / OTP cooldown.**
   Auth calls go straight from the browser to Supabase. Supabase enforces its own OTP limits, but add a client-side resend cooldown (and optionally an API route with the existing `withRateLimit` infra) to prevent email bombing.

8. **P3 — Minor hardening.**
   - `getCurrentUser()` double-calls `getUser()` when a Bearer token is present.
   - `useAuth` ignores `onAuthStateChange` events (`PASSWORD_RECOVERY`, `TOKEN_REFRESHED`, `USER_UPDATED`, …).
   - No account-linking UX: email/password signup then Google with the same email creates separate accounts by default in Supabase.

## Feasibility

Both OAuth and OTP are **natively supported by Supabase Auth** — no new dependencies or server infra needed.

- **OAuth**: `supabase.auth.signInWithOAuth` — Google / Apple / GitHub.
- **OTP**: supported by Supabase but deferred because the hosted email service is not suitable for Flowy's current needs.
- **TOTP MFA**: `supabase.auth.mfa.enroll`, `challenge`, `verify`, `listFactors`, and `unenroll`. Supabase documents the TOTP API as free and enabled by default on all projects.

### Dashboard prerequisites (manual, outside code)

- **Auth → Providers**: enable Google (OAuth consent screen), Apple (service ID), GitHub (OAuth app); add client IDs/secrets.
- **Auth → URL Configuration**: add `https://flowy-jade.vercel.app/auth/callback` and `http://localhost:3000/auth/callback` to **Redirect URLs**; set the **Site URL**.
- **Auth → Email**: passwordless email is intentionally disabled in the app for now. Supabase's hosted email service is restricted and does not provide a reliable code-based flow without custom email configuration.
- **Auth → MFA**: keep TOTP/App Authenticator verification enabled. It does not require SMTP or SMS and is available on the Supabase Free plan.
- **Auth → URL Configuration**: keep the callback redirect URL allow-listed for both local and production environments.
- **SMTP**: the built-in emailer is rate-limited — configure a custom SMTP for reliable delivery.

The server callback route still accepts PKCE `code` and Supabase `token_hash` redirects for signup confirmation and recovery flows.

## Implementation plan

### Current implementation status

- ✅ Phase 0: all `/auth/*` routes are public during callback exchange; callback errors and recovery are handled; internal `next` paths are validated.
- ✅ Phase 1: `/auth/reset-password` completes recovery sessions with localized validation and errors.
- ✅ Phase 2: Google, Apple, and GitHub OAuth buttons are available on login and registration pages through a centralized wrapper.
- ⏸ Phase 3: passwordless email OTP/magic-link sign-in is deferred until custom email delivery is configured.
- ✅ Phase 4: optional TOTP MFA is implemented with enrollment, backup authenticators, login challenges, dashboard gating, and multi-factor selection.
- ⏳ Phase 5: account linking, deeper provider/error coverage, auth rate-limit UX, recovery codes, and focused auth tests remain follow-ups.


### Phase 0 — Unblock callbacks (P0, ~20 lines)

- `middleware.ts`: make all `/auth/*` paths public (fixes OAuth, email confirmation, and password recovery in one change).
- `src/app/auth/callback/route.ts`:
  - Validate `next` — internal path only (starts with `/`, not `//`, no scheme).
  - Handle `error` query param → redirect to `/auth/login?error=...` and surface a localized message.
  - Branch on `type`:
    - `recovery` → redirect to `/auth/reset-password`.
    - otherwise → redirect to validated `next` (default `/dashboard`).

### Phase 1 — Password recovery completion

- New page `/auth/reset-password` (client component, part of `/auth` layout):
  - New password + confirm fields with localized validation.
  - Calls `supabase.auth.updateUser({ password })` (session comes from the exchanged recovery code).
  - Shows a localized success state and a link back to sign in.
- Add i18n keys in `src/lib/i18n/locales/en.ts` and `es.ts` (auth namespace).
- New pages are automatically public once Phase 0's `/auth/*` rule lands.

### Phase 2 — OAuth

- `src/lib/supabase/auth.ts`:
  - Unify `OAuthProvider = "google" | "apple" | "github"` (single source of truth).
  - Centralize `signInWithOAuth(provider)` with the PKCE callback redirect.
  - Note: Supabase's OAuth client API does not accept arbitrary signup metadata in `signInWithOAuth`; provider profile metadata is handled by Supabase, while app locale/currency defaults can be adjusted after first sign-in.
- Shared component `src/components/auth/oauth-buttons.tsx`: Google / Apple / GitHub buttons on login and registration.
- Localized mapping for common provider and already-registered errors.

### Phase 3 — OTP / magic link (deferred)

Do not expose passwordless email sign-in until a reliable email delivery path is configured. Supabase's hosted email service is limited to authorized addresses and low sending quotas, while numeric OTP requires a configurable template or email hook.

When revisiting this phase, add `signInWithOtp`/`verifyOtp`, a client-side magic-link landing page, resend rate limiting, and the corresponding English/Spanish translations.

### Phase 4 — TOTP MFA (free Supabase plan)

- Settings security panel: enroll an authenticator and collect its user-facing name on the same setup screen, using a QR code or manual secret, verify the first code, list verified factors by name, add a backup authenticator, and require a fresh code before removing any factor.
- Supabase currently has no supported client API to rename an already-enrolled factor (`updateFactor` is not available). Flowy stores an app-owned label alias in the user's metadata for existing-factor renames, while the underlying Supabase factor and secret remain unchanged; this avoids undocumented Auth endpoints and avoids silently rotating a user's authenticator secret.
- `/auth/mfa`: challenge page for users whose validated session is `aal1` but has a verified TOTP factor requiring `aal2`.
- `MfaGate`: the dashboard landing page checks assurance before rendering financial data; dashboard subpages do not repeat the MFA check.
- Recovery guidance: Supabase does not issue recovery codes, so the UI recommends enrolling a backup authenticator before removing the only factor.
- Normal API authentication validates the user only; it does not enumerate MFA factors on every request. MFA verification is handled by the login challenge and dashboard gate.
- Multiple verified factors can be selected during the MFA login challenge.
- No SMTP, SMS provider, schema migration, or new dependency is required.

### Phase 5 — Hardening (remaining follow-ups)

- Account linking UX: if OAuth hits an existing email account, offer password sign-in then `linkIdentity`.
- Expand error-code coverage (`weak_password`, provider-specific errors, and additional email delivery failures).
- Revisit the app-owned factor-label alias if Supabase adds a first-class update API; do not call undocumented Auth endpoints from the browser.
- Consider server-side auth/OTP rate limiting if abuse becomes a concern.
- Keep `getCurrentUser()` optimized so a valid Bearer-token lookup does not fall through to a second cookie lookup.

## Conventions to respect while implementing

- Every user-facing string in both `en.ts` and `es.ts` — no hardcoded text.
- `pnpm lint`, `pnpm typecheck`, and `pnpm build` must pass; commit format `feat(auth): …`.
- Follow the layered pattern: pages → `src/lib/supabase/auth.ts` wrapper → Supabase. No Prisma from auth pages.
- Keep offline/realtime unaffected (auth is orthogonal, but `useAuth` changes must not strand sessions in a half-authenticated state).
- This is a multi-session-sized chunk — land it in small, shippable slices (Phase 0 first).
