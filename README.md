# Monsoon Ready

A calm, GenAI-powered monsoon preparedness and citizen assistance app — built
for the PromptWars "Monsoon Preparedness & Citizen Assistance" challenge and
deployed on Cloudflare Workers.

## The problem

Monsoon season brings sudden heavy rain, flooding, waterlogging, travel
disruption, power cuts, and real health risks — but the guidance for dealing
with it is scattered across a weather app, a news alert, a government
advisory PDF, and word of mouth. None of it is personalized to your specific
household, and by the time you've pieced it together, the moment to act has
often passed.

## What Monsoon Ready does

Monsoon Ready is a single, citizen-facing web app that turns live weather
data into calm, personalized, plain-language guidance — before, during, and
after a monsoon event.

- **Onboarding** — tell it your name, pick your location from a live city
  search (or auto-detect it), your household's context (adults, children,
  elderly, pets, medical needs), and a preferred language. Skippable if you
  just want to look around first.
- **Home dashboard** — current weather for your location plus an AI-written,
  phase-aware risk summary, a **Before / During / After** switch that
  reframes guidance around where you actually are in a monsoon event, and
  at-a-glance preparedness progress and active alert counts.
- **My Plan** — an AI-generated preparedness checklist tailored to your
  household, organized by phase, with progress that's actually saved
  between visits instead of resetting every time you navigate away.
- **Active Alerts** — real-time severity is computed from live rainfall
  intensity and wind speed (not guessed), and an AI-written plain-language
  explanation is only generated when conditions genuinely warrant one — a
  calm day correctly shows "no active alerts," not a padded-out fake alert.
- **AI Assistant** — ask anything about monsoon safety, emergency kits, or
  local conditions, in whatever language you type in; it detects and
  responds in kind.
- **Travel Advisory** — pick a destination from the same live location
  search and get a safety assessment grounded in that destination's actual
  current weather.
- **Settings** — OLED-black/light theme toggle, profile, a plain-language
  privacy note, and a full reset.

## Why it helps

- **One place, not five.** Weather, personalized checklist, real-time
  alerts, a safety chatbot, and travel advisories live in one calm
  interface instead of being stitched together by the user under stress.
- **Personalized, not generic.** A household with elderly members, young
  children, or pets gets a genuinely different checklist than a single
  adult living alone — the AI plan reflects that context rather than
  handing everyone the same generic list.
- **Grounded, not hallucinated.** Every AI-written summary, alert, and
  advisory is generated from real live weather data (via Open-Meteo)
  fetched at request time — the model is explaining real numbers, not
  inventing plausible-sounding conditions. For a safety product, false
  confidence is worse than no answer, so this distinction is deliberate
  throughout the codebase (see [CLAUDE.md](./CLAUDE.md)).
- **Meets people where they are.** No account or login required — nothing
  to sign up for during an emergency. Multilingual by default, since a
  safety app that only works in one language doesn't serve everyone it
  needs to. A live location picker (the same kind of city search Google
  Weather uses) means you're never blocked by a misspelled or unrecognized
  city name.
- **Organized around the challenge's own framing.** Before / During / After
  isn't just a label — it's the app's actual navigational spine, so the
  same dashboard reframes itself around what phase of the event you're
  actually in.

## Design

Minimal, rounded, OLED-black-first UI with a light mode toggle — deliberately
calm rather than busy, since a preparedness app should feel reassuring, not
like a cluttered dashboard. A single accent color is used sparingly for
interactive elements; severity is always communicated with an icon and a
text label, never color alone.

## Privacy & security

- No account, no login, no server-side user database. Your profile
  (name, location, household context, language) lives only in your
  browser's `localStorage`.
- The Gemini API key is a Cloudflare Worker secret and is never sent to, or
  readable from, the client.

## Stack

- React 19 + Vite + Tailwind CSS v4 (frontend)
- Hono running as a Cloudflare Worker (`src/worker/`) for `/api/*`
- Google Gemini (`@google/genai`) for AI-generated text, called only from
  the Worker
- Open-Meteo (geocoding + forecast) for live weather, feeding real numbers
  into every Gemini prompt
- No login — a local profile lives in the browser's `localStorage`

## Run locally

1. `npm install`
2. Put your Gemini key in a `.dev.vars` file at the repo root (gitignored):
   ```
   GEMINI_API_KEY=your-key-here
   ```
3. `npm run dev` — this runs the real Worker locally via
   `@cloudflare/vite-plugin`, so `/api/*` calls hit the actual Gemini and
   Open-Meteo APIs, not a mock server.

Other scripts: `npm run typecheck`, `npm run lint`, `npm run check`,
`npm test`, `npm run build`.

## Deploy to Cloudflare Workers

### Option A — deploy from your machine

```
npx wrangler login                      # one-time browser auth
npx wrangler secret put GEMINI_API_KEY  # paste your key when prompted
npm run deploy                          # builds and runs `wrangler deploy`
```

### Option B — connect this GitHub repo in the Cloudflare dashboard

1. Push this repo to GitHub.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Import a
   repository**, and authorize/select this repo.
3. Build settings: build command `npm run build`, deploy command
   `npx wrangler deploy` (Cloudflare's Workers Builds preset for Vite
   projects should detect these automatically).
4. Under the Worker's **Settings → Variables and Secrets**, add
   `GEMINI_API_KEY` as an **encrypted secret** — do not put it in a plain
   environment variable or in `wrangler.jsonc`.
5. Trigger a build (push to the connected branch, or deploy manually from
   the dashboard).

Either way, `GEMINI_API_KEY` must end up as a Worker secret — it is never
read from `.env`/`.dev.vars` in production, and the frontend never sees it.
