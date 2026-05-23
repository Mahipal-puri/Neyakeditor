import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../ui/GlassCard';
import { useToast } from '../ui/Toaster';
import { templates as fallbackTemplates, templateCategories as FALLBACK_CATEGORIES } from '../../data/templates';

export default function TemplateGallery({ templates, notice }) {
  const list = templates ?? fallbackTemplates;
  const [active, setActive] = useState('All');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Derive categories from whatever the API gave us, so Unsplash "Photos"
  // appears automatically when present.
  const categories = useMemo(() => {
    const seen = new Set(['All']);
    for (const t of list) if (t.category) seen.add(t.category);
    // Preserve the original ordering for known categories, append new ones.
    const ordered = ['All', ...FALLBACK_CATEGORIES.filter((c) => c !== 'All' && seen.has(c))];
    for (const c of seen) if (!ordered.includes(c)) ordered.push(c);
    return ordered;
  }, [list]);

  const filtered =
    active === 'All' ? list : list.filter((t) => t.category === active);

  const onPick = (t) => {
    toast(`Opening "${t.name}" in the editor…`, { type: 'success' });
    navigate(`/editor?template=${encodeURIComponent(t.id)}`);
  };

  return (
    <div className="mt-12">
      {notice && (
        <div className="mb-6 max-w-3xl mx-auto text-center text-xs text-slate-400 italic">
          {notice}
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setActive(c)}
            className={`px-4 py-2 text-sm rounded-full transition-all ${
              active === c
                ? 'bg-grad-neon text-white shadow-glow-cyan'
                : 'glass text-slate-300 hover:bg-white/10'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35 }}
            >
              <button
                type="button"
                onClick={() => onPick(t)}
                className="w-full text-left rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/60"
                aria-label={`Use template ${t.name}`}
              >
                <GlassCard className="p-0 overflow-hidden group">
                  <div className="aspect-[4/5] relative">
                    {t.imageUrl ? (
                      <img
                        src={t.thumbnailUrl ?? t.imageUrl}
                        alt={t.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${t.gradient ?? 'from-neon-cyan to-neon-purple'}`}
                      >
                        <div
                          className="absolute inset-0 opacity-30 mix-blend-overlay"
                          style={{
                            backgroundImage:
                              'radial-gradient(circle at 30% 30%, white 0%, transparent 40%)',
                          }}
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wider bg-black/40 backdrop-blur-sm">
                      {t.category}
                    </div>
                    {t.source === 'unsplash' && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wider bg-black/40 backdrop-blur-sm text-emerald-300">
                        Photo
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="font-display font-semibold text-white truncate">
                        {t.name}
                      </div>
                      <div className="text-xs text-slate-200/80 mt-0.5 truncate">
                        {t.credit?.name ? `Photo · ${t.credit.name}` : 'Tap to use template'}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
