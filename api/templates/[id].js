// Vercel serverless port of the dev-only templatesApi middleware (single route).
//
//   GET /api/templates/:id → template object or 404

import { LOCAL_TEMPLATES, getUnsplash } from '../_lib/templates-data.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const id = String(req.query?.id ?? '');
    if (!id) {
      res.status(400).json({ error: 'Missing id' });
      return;
    }
    const unsplash = await getUnsplash();
    const all = [...LOCAL_TEMPLATES, ...unsplash];
    const found = all.find((t) => String(t.id) === id);
    if (!found) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(200).json(found);
  } catch (err) {
    res.status(500).json({ error: err.message ?? 'Server error' });
  }
}
