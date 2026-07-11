# Monsoon Ready

A GenAI-powered monsoon preparedness and citizen assistance app, built for
the PromptWars "Monsoon Preparedness & Citizen Assistance" challenge.
Deployed on Cloudflare Workers. See [CLAUDE.md](./CLAUDE.md) for the full
architecture and the rules this project is held to.

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

Other scripts: `npm run typecheck`, `npm test`, `npm run build`.

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
