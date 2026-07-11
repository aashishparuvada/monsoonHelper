# Monsoon Ready — CLAUDE.md

GenAI-powered monsoon preparedness and citizen assistance app, built for the
PromptWars "Monsoon Preparedness & Citizen Assistance" challenge. Deployed on
Cloudflare Workers.

## Scoring context (why these rules exist)

Submissions are scored on: Code Quality (high), Problem Statement Alignment
(high), Security (medium), Efficiency (medium), Testing (low), Accessibility
(low). Evaluators run a **hands-on functional test of the actual deployed
app** after the challenge closes — not just a code read. The rules below are
written against that reality.

## Hard rules — will get the project disqualified if broken

1. **No static/hardcoded pages.** Every screen that claims to show weather,
   alerts, a preparedness plan, or an AI response must be backed by a real
   function call, not fixture data baked into JSX.
2. **No mock/fake/placeholder data presented as real output.** If live data
   isn't available, show a genuine loading or error/empty state — never a
   hardcoded stand-in dressed up as a result.
3. **No hallucinated or canned AI responses.** Every "AI" answer must come
   from an actual Gemini API call made at request time. `setTimeout`-based
   fake replies are exactly what gets flagged — do not (re)introduce them.
4. **Test end-to-end before considering something done.** Walk through the
   feature as an evaluator would: fresh load, real network calls, both
   themes, both a normal and a failure case.
5. There is no login in this app (by design — see Architecture). If that
   ever changes, credentials must be handed to evaluators, never assumed.

## Architecture

- **Frontend:** React 19 + Vite, Tailwind CSS v4 (tokens live in
  `src/index.css` under `@theme` / `:root` — see Theme section).
- **Backend:** a single Cloudflare Worker (Hono router) serving both the
  built static frontend and `/api/*` routes. No separate Node/Express
  server — the Workers runtime cannot run `express`/`http.listen`.
- **Build/deploy:** `@cloudflare/vite-plugin` integrates the real Workers
  runtime into `vite dev`, and `vite build` + `wrangler deploy` ships both
  static assets and the Worker together. See `wrangler.jsonc`.
- **AI:** Google Gemini API (`@google/genai`), called **only** from the
  Worker. The frontend never sees the API key.
- **Weather data:** Open-Meteo (geocoding + forecast), free and keyless.
  Live conditions are fetched first, then handed to Gemini as context for
  plain-language summaries/alerts/advisories — the model explains real
  data, it doesn't invent it.
- **Identity:** no auth. A local profile (name, location, household
  context, language) is stored in `localStorage` on the client. Nothing
  server-side is keyed to a user account.

## Secrets

- Local dev: put `GEMINI_API_KEY` in `.dev.vars` (gitignored, read
  automatically by `wrangler dev` / the Vite Cloudflare plugin).
- Production: `wrangler secret put GEMINI_API_KEY` — never in
  `wrangler.jsonc`, never in client code, never in git.
- `.env` / `.env.*` / `.dev.vars*` are gitignored. If a commit ever needs to
  touch one of these files, stop and ask first.

## Theme

- Two modes: OLED black (`:root` default, true `#000000` background) and
  light (`.light` class override, pure white). Toggle is reachable from the
  header and Settings.
- Color tokens are defined once in `src/index.css`. Semantic Tailwind
  utilities (`bg-brand`, `bg-status-amber`, etc.) must be declared inside
  the `@theme` block to actually generate in Tailwind v4 — don't add a
  color to `:root` and expect a matching utility class to exist.
- Severity must never be color-only: pair color with an icon and a text
  label (already the pattern in `Alerts.tsx` — keep it that way).
- Shared primitives live in `src/components/ui/` (`Button`, `Card`, `Chip`,
  `Input`, `PhaseIndicator`, `LoadingSkeleton`). Screens should compose
  these rather than re-implementing the same markup inline.

## Product spine

Navigation and UI are organized around the challenge's own language:
**Before / During / After** the monsoon event. The phase indicator on the
dashboard is the app's core metaphor — new features should slot into one
of these three phases rather than becoming a fourth top-level concept.

## Code quality conventions

- TypeScript strict; no `any` where a real type is knowable.
- No comments explaining _what_ code does — only _why_, for non-obvious
  constraints (e.g. a Gemini prompt-format quirk, a Workers runtime
  limitation).
- Don't add abstractions, config flags, or error handling for cases that
  can't happen. Validate at the boundary (user input into API routes), trust
  everything past that.
- Keep components presentational where possible; data fetching lives in
  small hooks/`api.ts`, not scattered `fetch` calls inside JSX.
- Repeated async loading/success/error state across screens belongs in the
  shared `useAsyncData` hook (`src/hooks/useAsyncData.ts`), not copy-pasted
  per screen.
- `npm run check` (typecheck + `eslint .` + `prettier --check .`) and
  `npm test` (Vitest — Worker routes, `lib/`, and component tests) must
  both pass before committing — it's what the pre-commit hook runs.

## Testing conventions

- Worker route tests (`src/worker/index.test.ts`) mock `./gemini` and
  `global.fetch`, then drive the real Hono app via `app.request(...)` —
  this exercises the actual input-validation/branching logic, not just
  the helper modules underneath it.
- Tests that need `localStorage` or the DOM opt in per-file with a
  `// @vitest-environment jsdom` docblock; the default environment is
  plain Node for fast pure-logic tests.
- `npm test` runs with `NODE_OPTIONS=--no-experimental-webstorage` —
  recent Node versions ship a native global `localStorage` that shadows
  jsdom's implementation and lacks methods like `.clear()`; don't remove
  this flag when touching the test script.

## Git workflow

- Commit in small, logical, real increments as work lands (not one giant
  commit at the end) — history should read as genuine incremental
  development.
- A local pre-commit hook (`.git/hooks/pre-commit`, not tracked by git)
  blocks commits that stage `.env`/`.dev.vars` and runs `npm run check`
  and `npm test`. Don't bypass it with `--no-verify`.
