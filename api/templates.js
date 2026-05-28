// Vercel serverless port of the dev-only templatesApi middleware (list route).
//
//   GET /api/templates → { templates, sources, notice? }

import { LOCAL_TEMPLATES, getUnsplash, HAS_UNSPLASH } from './_lib/templates-data.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const unsplash = await getUnsplash();
    const all = [...LOCAL_TEMPLATES, ...unsplash];
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(200).json({
      templates: all,
      sources: { local: LOCAL_TEMPLATES.length, unsplash: unsplash.length },
      ...(HAS_UNSPLASH
        ? {}
        : {
            notice:
              'Set UNSPLASH_ACCESS_KEY in Vercel env vars to enrich the catalog with real photos.',
          }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message ?? 'Server error' });
  }
}
