import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), replicateProxy(env), mediapipeWasm(), templatesApi(env)],
    server: { port: 5173, open: true },
  };
});

/**
 * Serves the @mediapipe/tasks-vision WASM bundle from node_modules under
 * `/mediapipe-wasm/*`. This guarantees the JS SDK and WASM binary always
 * match — the #1 cause of silent HandLandmarker failures was a CDN URL
 * pinned to a different version than the installed npm package.
 */
function mediapipeWasm() {
  const WASM_DIR = path.resolve('node_modules/@mediapipe/tasks-vision/wasm');
  const MODEL_CACHE_DIR = path.resolve('.mediapipe-cache');
  const MODEL_FILE = 'hand_landmarker.task';
  const MODEL_CACHE = path.join(MODEL_CACHE_DIR, MODEL_FILE);
  const MODEL_REMOTE =
    'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

  let pendingFetch = null;
  async function ensureModel() {
    if (fs.existsSync(MODEL_CACHE) && fs.statSync(MODEL_CACHE).size > 0) {
      return MODEL_CACHE;
    }
    if (pendingFetch) return pendingFetch;
    pendingFetch = (async () => {
      fs.mkdirSync(MODEL_CACHE_DIR, { recursive: true });
      console.log('[mediapipe] downloading hand landmarker model (one-time, ~7 MB)…');
      const r = await fetch(MODEL_REMOTE);
      if (!r.ok) throw new Error(`Model download failed: ${r.status}`);
      const buf = Buffer.from(await r.arrayBuffer());
      fs.writeFileSync(MODEL_CACHE, buf);
      console.log(`[mediapipe] cached ${buf.length} bytes to ${MODEL_CACHE}`);
      return MODEL_CACHE;
    })().finally(() => {
      pendingFetch = null;
    });
    return pendingFetch;
  }

  function streamFile(res, filepath, contentType) {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Content-Length', String(fs.statSync(filepath).size));
    fs.createReadStream(filepath).pipe(res);
  }

  return {
    name: 'neyak-mediapipe',
    // Dev: serve wasm from node_modules, model from disk cache.
    configureServer(server) {
      // Kick off the model download in the background so it's ready by the
      // time the user clicks Enable.
      ensureModel().catch((err) => console.error('[mediapipe]', err));

      server.middlewares.use('/mediapipe-wasm', (req, res, next) => {
        const raw = (req.url || '').split('?')[0];
        const filename = path.basename(raw).replace(/[^a-z0-9_.-]/gi, '');
        if (!filename) return next();
        const filepath = path.join(WASM_DIR, filename);
        if (!filepath.startsWith(WASM_DIR) || !fs.existsSync(filepath)) {
          return next();
        }
        const ext = path.extname(filename).toLowerCase();
        const ct =
          ext === '.wasm'
            ? 'application/wasm'
            : ext === '.js'
            ? 'application/javascript'
            : 'application/octet-stream';
        streamFile(res, filepath, ct);
      });

      server.middlewares.use('/mediapipe-model', async (req, res, next) => {
        const raw = (req.url || '').split('?')[0];
        const filename = path.basename(raw).replace(/[^a-z0-9_.-]/gi, '');
        if (filename !== MODEL_FILE) return next();
        try {
          const filepath = await ensureModel();
          streamFile(res, filepath, 'application/octet-stream');
        } catch (err) {
          res.statusCode = 502;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
    // Build: bake wasm + model into dist so prod has no external deps.
    async generateBundle() {
      if (fs.existsSync(WASM_DIR)) {
        for (const file of fs.readdirSync(WASM_DIR)) {
          const filepath = path.join(WASM_DIR, file);
          if (!fs.statSync(filepath).isFile()) continue;
          this.emitFile({
            type: 'asset',
            fileName: `mediapipe-wasm/${file}`,
            source: fs.readFileSync(filepath),
          });
        }
      }
      try {
        const modelPath = await ensureModel();
        this.emitFile({
          type: 'asset',
          fileName: `mediapipe-model/${MODEL_FILE}`,
          source: fs.readFileSync(modelPath),
        });
      } catch (err) {
        this.warn(`MediaPipe model not bundled: ${err.message}`);
      }
    },
  };
}

/**
 * Dev-only middleware that proxies `POST /api/remove-bg` to Replicate.
 * Keeps REPLICATE_API_TOKEN server-side so it never reaches the client bundle.
 */
function replicateProxy(env) {
  const TOKEN = env.REPLICATE_API_TOKEN ?? '';
  const MODEL = env.REPLICATE_BG_MODEL || '851-labs/background-remover';

  return {
    name: 'neyak-replicate-proxy',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/remove-bg', async (req, res) => {
        // CORS-safe basics
        res.setHeader('Cache-Control', 'no-store');

        if (req.method === 'GET') {
          // Health/status endpoint — handy for the UI to detect missing token.
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ configured: Boolean(TOKEN), model: MODEL }));
          return;
        }
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }
        if (!TOKEN) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error:
                'REPLICATE_API_TOKEN is not set. Copy .env.example to .env, fill in your token, then restart `npm run dev`.',
            })
          );
          return;
        }

        try {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const raw = Buffer.concat(chunks).toString('utf8');
          const body = raw ? JSON.parse(raw) : {};
          if (!body.image) throw new Error('Request body must include `image` (data URL).');

          // Replicate's "wait" header blocks for up to 60s so most predictions
          // come back inline — no polling needed.
          const r = await fetch(
            `https://api.replicate.com/v1/models/${MODEL}/predictions`,
            {
              method: 'POST',
              headers: {
                Authorization: `Token ${TOKEN}`,
                'Content-Type': 'application/json',
                Prefer: 'wait=60',
              },
              body: JSON.stringify({ input: { image: body.image } }),
            }
          );

          if (!r.ok) {
            const errText = await r.text();
            console.error('[remove-bg] Replicate API error', r.status, errText);
            res.statusCode = r.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Replicate API ${r.status}: ${errText}` }));
            return;
          }

          const prediction = await r.json();
          if (prediction.status !== 'succeeded') {
            res.statusCode = 202;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error:
                  prediction.error ||
                  `Prediction still ${prediction.status}. Try again in a few seconds.`,
                status: prediction.status,
                id: prediction.id,
              })
            );
            return;
          }

          const outputUrl = Array.isArray(prediction.output)
            ? prediction.output[0]
            : prediction.output;
          if (!outputUrl) throw new Error('Replicate returned an empty output.');

          const imgRes = await fetch(outputUrl);
          if (!imgRes.ok) throw new Error(`Failed to fetch output image: ${imgRes.status}`);
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          const ct = imgRes.headers.get('content-type') || 'image/png';

          res.statusCode = 200;
          res.setHeader('Content-Type', ct);
          res.setHeader('Content-Length', String(buffer.length));
          res.end(buffer);
        } catch (err) {
          console.error('[remove-bg]', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message ?? 'Unknown server error.' }));
        }
      });
    },
  };
}

/**
 * GET /api/templates           → { templates: [...], sources: {...} }
 * GET /api/templates/:id       → single template object (404 if not found)
 *
 * Always serves the local gradient catalog. If `UNSPLASH_ACCESS_KEY` is set
 * in .env, additionally fetches 12 real photo templates from Unsplash and
 * merges them in. The list is cached server-side for 10 minutes so the
 * Unsplash rate-limit (50 req/h on the free tier) is never a problem even
 * with HMR reloads.
 */
function templatesApi(env) {
  const QUERY = env.UNSPLASH_TEMPLATES_QUERY || 'abstract,design,art,texture';
  const HAS_UNSPLASH = !!env.UNSPLASH_ACCESS_KEY;
  let localCache = null;
  let unsplashCache = null;
  let unsplashAt = 0;
  const UNSPLASH_TTL_MS = 10 * 60 * 1000;

  async function getLocal() {
    if (!localCache) {
      const mod = await import('./src/data/templates.js');
      localCache = mod.templates.map((t) => ({
        ...t,
        source: 'local',
      }));
    }
    return localCache;
  }

  async function getUnsplash() {
    if (!HAS_UNSPLASH) return [];
    const now = Date.now();
    if (unsplashCache && now - unsplashAt < UNSPLASH_TTL_MS) {
      return unsplashCache;
    }
    try {
      const url = new URL('https://api.unsplash.com/photos/random');
      url.searchParams.set('count', '12');
      url.searchParams.set('orientation', 'portrait');
      url.searchParams.set('query', QUERY);
      const r = await fetch(url, {
        headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` },
      });
      if (!r.ok) {
        console.warn(`[templates] Unsplash returned ${r.status}`);
        return unsplashCache || [];
      }
      const data = await r.json();
      unsplashCache = data.map((p, i) => ({
        id: `u-${p.id}`,
        name: p.alt_description?.slice(0, 40) || `Unsplash ${i + 1}`,
        category: 'Photos',
        source: 'unsplash',
        imageUrl: p.urls.regular,
        thumbnailUrl: p.urls.small,
        credit: {
          name: p.user.name,
          link: p.user.links.html,
        },
      }));
      unsplashAt = now;
      return unsplashCache;
    } catch (err) {
      console.error('[templates] Unsplash fetch failed', err);
      return unsplashCache || [];
    }
  }

  function jsonResponse(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.end(JSON.stringify(body));
  }

  return {
    name: 'neyak-templates-api',
    configureServer(server) {
      server.middlewares.use('/api/templates', async (req, res) => {
        try {
          if (req.method !== 'GET') {
            return jsonResponse(res, 405, { error: 'Method not allowed' });
          }
          // The middleware path is mounted at /api/templates, so req.url
          // contains only what's beyond that — e.g. `/` for list or `/u-abc`
          // for a single item.
          const rest = (req.url || '/').split('?')[0];
          const id = rest === '/' || rest === '' ? null : decodeURIComponent(rest.replace(/^\//, ''));

          const [local, unsplash] = await Promise.all([getLocal(), getUnsplash()]);
          const all = [...local, ...unsplash];

          if (id) {
            const found = all.find((t) => String(t.id) === id);
            if (!found) return jsonResponse(res, 404, { error: 'Template not found' });
            return jsonResponse(res, 200, found);
          }

          jsonResponse(res, 200, {
            templates: all,
            sources: { local: local.length, unsplash: unsplash.length },
            ...(HAS_UNSPLASH
              ? {}
              : { notice: 'Set UNSPLASH_ACCESS_KEY in client/.env to enrich the catalog with real photos.' }),
          });
        } catch (err) {
          console.error('[templates]', err);
          jsonResponse(res, 500, { error: err.message ?? 'Server error' });
        }
      });
    },
  };
}
