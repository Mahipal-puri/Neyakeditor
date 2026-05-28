# Feature: Vercel deployment configuration

**Date:** 2026-05-28
**Kind:** Infrastructure / deployment
**Area:** Repo root, serverless functions

## Summary

The project shipped as a Vite app under `client/` with all four API endpoints
(`/api/remove-bg`, `/api/stylize`, `/api/animegan`, `/api/templates`)
implemented as **dev-only** middleware in `client/vite.config.js`. That works
under `npm run dev` but disappears in a static build — every `fetch('/api/…')`
returns 404 in production.

This change wires up Vercel so the same app deploys at
[vercel.com/mahipal-s-projects1/neyakeditor](https://vercel.com/mahipal-s-projects1/neyakeditor)
with all four endpoints working as serverless functions.

## How it's structured

```
neyakeditor/
├── vercel.json             ← build/route config (NEW)
├── package.json            ← root, sets "type": "module" for /api ESM (NEW)
├── api/                    ← Vercel serverless functions (NEW)
│   ├── remove-bg.js        ← port of replicateProxy middleware
│   ├── stylize.js          ← port of replicateStylize middleware
│   ├── animegan.js         ← port of animeganStylize middleware
│   ├── templates.js        ← list route (GET /api/templates)
│   ├── templates/[id].js   ← single-template route (GET /api/templates/:id)
│   └── _lib/
│       └── templates-data.js  ← shared local catalog + Unsplash fetch
└── client/                 ← Vite app (unchanged)
```

`vercel.json` tells Vercel to:
- Build with `npm --prefix client install && npm --prefix client run build`
- Publish `client/dist` as the static output
- Treat any unmatched path as an SPA route → serve `/index.html`
- Allow `/api/*` functions up to **60 s** (Replicate's blocking `Prefer: wait`
  header can stall ~55 s, AnimeGAN SSE can be slow on cold start)
- Skip an `npm install` at the repo root (root `package.json` has no deps;
  all packages live in `client/`)

## Why each /api/*.js file

Vercel deploys every `.js` file in `api/` as an independent Node serverless
function. Files inside `api/_lib/` (underscore prefix) are bundled but not
deployed as functions, so they're the right place for shared helpers.

The functions are 1:1 ports of the dev middleware in `client/vite.config.js`.
They keep the same request/response contract so the client code in
[client/src/lib/](../client/src/lib/) didn't need to change at all — `fetch('/api/remove-bg')`
works identically in dev and on Vercel.

Notable adjustments vs. the dev middleware:

- `Prefer: wait=60` → `Prefer: wait=55` to leave a few seconds of slack before
  Vercel's 60 s `maxDuration` ceiling.
- `process.cwd()`-relative module imports (e.g. `./src/data/templates.js`) are
  unavailable in the function bundle, so the template catalog is mirrored
  into [`api/_lib/templates-data.js`](../api/_lib/templates-data.js).
- The Unsplash 10-minute cache uses module-level variables — this survives
  across **warm** invocations only. Cold starts (e.g. after deploy or a long
  idle) re-fetch. Acceptable: the free Unsplash tier is 50 req/h.

## MediaPipe assets

`mediapipeWasm()` in `client/vite.config.js` already has a `generateBundle()`
hook that copies the WASM bundle and the 7 MB hand-landmarker model into
`dist/mediapipe-wasm/` and `dist/mediapipe-model/` during `vite build`. So
`/mediapipe-wasm/*` and `/mediapipe-model/hand_landmarker.task` are served
as plain static assets in production — **no extra Vercel function needed**.

## Environment variables to set in Vercel

In the Vercel dashboard → Project → Settings → Environment Variables, add
(all optional; missing ones degrade to local fallbacks):

| Var | Purpose | Without it |
|---|---|---|
| `REPLICATE_API_TOKEN` | AI bg removal + AI styles | `/api/remove-bg` and `/api/stylize` return 503; editor falls back to local image processing |
| `REPLICATE_BG_MODEL` | Override the bg-removal model (default `851-labs/background-remover`) | Uses default |
| `REPLICATE_STYLE_MODEL` | Generic style-transfer model | AI styles disabled (local CSS-filter fallback) |
| `REPLICATE_<STYLE>_MODEL` | Per-style override (`GHIBLI`, `ANIME`, `CARTOON`, `SKETCH`, `WATERCOLOR`, `OILPAINT`, `POPART`, `PIXELART`) | Falls back to `REPLICATE_STYLE_MODEL` |
| `UNSPLASH_ACCESS_KEY` | Enriches `/api/templates` with 12 real photos | Only the 12 local gradient templates are returned |
| `UNSPLASH_TEMPLATES_QUERY` | Search query (default `abstract,design,art,texture`) | Uses default |

See [client/.env.example](../client/.env.example) for the same list documented
for local dev.

## Verification

1. **Local build:** `npm --prefix client run build` succeeds; `client/dist/`
   contains `index.html`, `assets/`, `mediapipe-wasm/`, `mediapipe-model/`.
2. **Vercel build:** push to `main` → Vercel auto-deploys → build log shows
   the `npm --prefix client …` command running and `client/dist` published.
3. **Static load:** the deployed URL loads the editor; `/editor`, `/templates`,
   `/about` etc. all resolve (SPA rewrite working).
4. **Function health checks** (each returns JSON, not 404):
   - `GET /api/remove-bg` → `{ configured, model }`
   - `GET /api/stylize` → `{ configured, perStyle, fallbackModel, perStyleModels }`
   - `GET /api/animegan` → `{ configured, styles, upstream, gradioVersion }`
   - `GET /api/templates` → `{ templates: [...12+ items], sources }`
   - `GET /api/templates/1` → single template object
5. **Real use:** with `REPLICATE_API_TOKEN` set in Vercel, "Remove background"
   in the editor produces a transparent PNG; with a style model set, the
   AI style cards swap in the styled image.

## Known limits

- **Vercel Hobby execution cap = 60 s.** Replicate cold-starts on rare large
  models can push past that. The function returns 202 with `{ status: 'starting' }`
  in that case; the client retries from the existing polling logic in
  [client/src/lib/stylize.js](../client/src/lib/stylize.js).
- **Payload limit ≈ 4.5 MB** on Vercel for serverless function bodies. Very
  large source images (> 6 MB after base64 expansion) will be rejected with
  413. Editor already downscales before upload, so this is rarely hit.

---

← Back to project spec: [markdown.md](../markdown.md)
