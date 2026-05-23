import { templates as fallback } from '../data/templates';

let listCache = null;

/**
 * Fetch the template catalog from /api/templates. Falls back to the
 * compiled-in local list on network error so the Templates page and the
 * editor never break if the dev server's plugin or Unsplash misbehaves.
 *
 * @returns {Promise<{templates: Array, sources: object, notice?: string}>}
 */
export async function fetchTemplates() {
  if (listCache) return listCache;
  try {
    const r = await fetch('/api/templates');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    listCache = {
      templates: Array.isArray(data.templates) ? data.templates : [],
      sources: data.sources ?? {},
      notice: data.notice,
    };
    return listCache;
  } catch (err) {
    console.warn('[templates] API fetch failed, using local fallback', err);
    return {
      templates: fallback,
      sources: { local: fallback.length },
      notice: 'Live template API unavailable — showing built-in catalog.',
    };
  }
}

/**
 * Fetch a single template by ID. Tries the API first, falls back to the
 * local list. Returns null if not found in either source.
 */
export async function fetchTemplate(id) {
  try {
    const r = await fetch(`/api/templates/${encodeURIComponent(id)}`);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (err) {
    console.warn('[templates] single fetch failed, using fallback', err);
    return fallback.find((t) => String(t.id) === String(id)) ?? null;
  }
}

export function clearTemplatesCache() {
  listCache = null;
}
