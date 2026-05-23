import { motion } from 'framer-motion';
import SectionHeading from '../components/ui/SectionHeading';
import GlassCard from '../components/ui/GlassCard';
import AIModelsTable from '../components/sections/AIModelsTable';
import CTASection from '../components/sections/CTASection';
import { features } from '../data/features';

const showcase = [
  { title: 'Background Removal', sub: 'U2Net · 0.6s avg', gradient: 'from-emerald-400 to-cyan-500' },
  { title: 'Clothes Change', sub: 'Stable Diffusion · 4.2s', gradient: 'from-rose-500 to-purple-600' },
  { title: 'Face Swap', sub: 'InsightFace · 1.1s', gradient: 'from-amber-400 to-rose-500' },
  { title: 'Anime Filter', sub: 'AnimeGAN · 0.9s', gradient: 'from-pink-400 to-violet-500' },
  { title: 'Talking Face', sub: 'SadTalker · 8.0s', gradient: 'from-cyan-400 to-indigo-500' },
  { title: 'Animation', sub: 'AnimateDiff · 12s', gradient: 'from-fuchsia-500 to-amber-400' },
  { title: 'Cinematic Relight', sub: 'In-house · 2.0s', gradient: 'from-indigo-500 to-rose-500' },
  { title: 'Object Removal', sub: 'AI inpainting · 1.4s', gradient: 'from-cyan-500 to-emerald-400' },
];

export default function AIShowcase() {
  return (
    <>
      <header className="pt-36 pb-8 container-page">
        <SectionHeading
          eyebrow="AI showcase"
          title="See what the models"
          highlight="can do"
          description="Every NeyakEditor feature is backed by a model fine-tuned for a single job — so the output looks like it was made on purpose."
        />
      </header>

      <section className="container-page">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {showcase.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <GlassCard className="p-0 overflow-hidden">
                <div className="grid grid-cols-2">
                  <div className="aspect-square bg-bg-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-grad-mesh opacity-30" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs uppercase tracking-wider text-slate-500">Before</span>
                    </div>
                  </div>
                  <div className={`aspect-square bg-gradient-to-br ${s.gradient} relative overflow-hidden`}>
                    <div
                      className="absolute inset-0 mix-blend-overlay opacity-40"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 50% 50%, white 0%, transparent 50%)',
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs uppercase tracking-wider text-white font-semibold drop-shadow">After</span>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{s.sub}</div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      <AIModelsTable />

      <section className="container-page mt-8">
        <SectionHeading
          eyebrow="The pipeline"
          title="From upload to"
          highlight="finished export"
          description="A single workflow stitches together gesture input, model inference, and rendering."
        />

        <ol className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            'Upload photo or video',
            'AI detects objects & faces',
            'Gesture tracking activates',
            'You edit with hand motions',
            'AI processes each change',
            'Live preview generated',
            'Export in chosen format',
            'Save to cloud or download',
          ].map((step, i) => (
            <motion.li
              key={step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <GlassCard className="h-full">
                <div className="text-3xl font-display font-bold text-gradient mb-2">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <p className="text-sm text-slate-200">{step}</p>
              </GlassCard>
            </motion.li>
          ))}
        </ol>
      </section>

      <CTASection />
    </>
  );
}
