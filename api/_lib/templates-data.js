// Shared template catalog used by api/templates.js and api/templates/[id].js.
// Underscore prefix keeps Vercel from deploying this file as its own function.
// Mirrors client/src/data/templates.js — keep in sync if either changes.

export const LOCAL_TEMPLATES = [
  { id: 1, name: 'Anime Portrait', category: 'Anime', gradient: 'from-pink-500 via-purple-500 to-indigo-500', stops: ['#ec4899', '#a855f7', '#6366f1'] },
  { id: 2, name: 'Cinematic Glow', category: 'Cinematic', gradient: 'from-amber-500 via-rose-500 to-purple-600', stops: ['#f59e0b', '#f43f5e', '#9333ea'] },
  { id: 3, name: 'Vintage 70s', category: 'Vintage', gradient: 'from-amber-700 via-orange-500 to-yellow-400', stops: ['#b45309', '#f97316', '#facc15'] },
  { id: 4, name: 'Cyberpunk City', category: 'Cyberpunk', gradient: 'from-fuchsia-500 via-purple-600 to-cyan-400', stops: ['#d946ef', '#9333ea', '#22d3ee'] },
  { id: 5, name: 'HDR Boost', category: 'HDR', gradient: 'from-cyan-400 via-blue-500 to-indigo-600', stops: ['#22d3ee', '#3b82f6', '#4f46e5'] },
  { id: 6, name: 'Cartoon Pop', category: 'Cartoon', gradient: 'from-yellow-400 via-pink-500 to-red-500', stops: ['#facc15', '#ec4899', '#ef4444'] },
  { id: 7, name: 'Dream Sequence', category: 'Dream', gradient: 'from-violet-400 via-pink-400 to-rose-300', stops: ['#a78bfa', '#f472b6', '#fda4af'] },
  { id: 8, name: 'Neon Night', category: 'Neon', gradient: 'from-emerald-400 via-cyan-400 to-fuchsia-500', stops: ['#34d399', '#22d3ee', '#d946ef'] },
  { id: 9, name: 'Futuristic Chrome', category: 'Futuristic', gradient: 'from-slate-200 via-cyan-300 to-violet-500', stops: ['#e2e8f0', '#67e8f9', '#8b5cf6'] },
  { id: 10, name: 'AI Fashion Shoot', category: 'Fashion', gradient: 'from-rose-500 via-purple-500 to-indigo-600', stops: ['#f43f5e', '#a855f7', '#4f46e5'] },
  { id: 11, name: 'Talking Avatar', category: 'Animation', gradient: 'from-cyan-500 via-purple-500 to-pink-500', stops: ['#06b6d4', '#a855f7', '#ec4899'] },
  { id: 12, name: 'Cinematic Merge', category: 'Composite', gradient: 'from-blue-600 via-purple-600 to-pink-500', stops: ['#2563eb', '#9333ea', '#ec4899'] },
].map((t) => ({ ...t, source: 'local' }));

const QUERY = process.env.UNSPLASH_TEMPLATES_QUERY || 'abstract,design,art,texture';
const KEY = process.env.UNSPLASH_ACCESS_KEY || '';
const TTL_MS = 10 * 60 * 1000;

// Module-level cache survives across warm function invocations on Vercel.
let unsplashCache = null;
let unsplashAt = 0;

export async function getUnsplash() {
  if (!KEY) return [];
  const now = Date.now();
  if (unsplashCache && now - unsplashAt < TTL_MS) return unsplashCache;
  try {
    const url = new URL('https://api.unsplash.com/photos/random');
    url.searchParams.set('count', '12');
    url.searchParams.set('orientation', 'portrait');
    url.searchParams.set('query', QUERY);
    const r = await fetch(url, {
      headers: { Authorization: `Client-ID ${KEY}` },
    });
    if (!r.ok) return unsplashCache || [];
    const data = await r.json();
    unsplashCache = data.map((p, i) => ({
      id: `u-${p.id}`,
      name: p.alt_description?.slice(0, 40) || `Unsplash ${i + 1}`,
      category: 'Photos',
      source: 'unsplash',
      imageUrl: p.urls.regular,
      thumbnailUrl: p.urls.small,
      credit: { name: p.user.name, link: p.user.links.html },
    }));
    unsplashAt = now;
    return unsplashCache;
  } catch {
    return unsplashCache || [];
  }
}

export const HAS_UNSPLASH = Boolean(KEY);
