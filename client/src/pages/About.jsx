import { motion } from 'framer-motion';
import SectionHeading from '../components/ui/SectionHeading';
import GlassCard from '../components/ui/GlassCard';
import GradientText from '../components/ui/GradientText';
import CTASection from '../components/sections/CTASection';
import { audience } from '../data/audience';
import { techStack, supportedMedia } from '../data/aiModels';

export default function About() {
  return (
    <>
      <header className="pt-36 pb-12 container-page">
        <SectionHeading
          eyebrow="About"
          title="An all-in-one"
          highlight="AI creative studio"
          description="NeyakEditor exists to collapse the gap between idea and image — so creators spend time creating, not fighting tools."
        />
      </header>

      {/* Vision */}
      <section className="container-page">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard hover={false} className="h-full">
              <h3 className="text-2xl font-display font-semibold mb-3">Our vision</h3>
              <p className="text-slate-300/90 leading-relaxed">
                Build an AI studio where anyone can upload any image or video,
                control editing using hand gestures, convert stills into
                cinematic animations, swap faces and outfits, merge scenes, and
                generate avatars — all in the browser, all at the speed of
                thought.
              </p>
              <ul className="mt-5 space-y-2 text-slate-200">
                {[
                  'Upload any image or video',
                  'Control editing with gestures',
                  'Convert images into animations',
                  'Change clothes with AI',
                  'Merge multiple photos',
                  'Generate cinematic effects',
                  'Create anime versions',
                  'Build AI avatars',
                ].map((v) => (
                  <li key={v} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                    {v}
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GlassCard hover={false} className="h-full relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-neon-purple/30 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-neon-cyan/20 blur-3xl" />
              <div className="relative">
                <h3 className="text-2xl font-display font-semibold mb-3">Tagline</h3>
                <p className="text-3xl sm:text-4xl font-display font-bold leading-tight">
                  "Edit{' '}
                  <GradientText>beyond reality</GradientText> with
                  AI & gestures."
                </p>
                <p className="mt-6 text-sm text-slate-400">
                  We believe the next generation of creative tools won't be
                  controlled with a mouse — they'll be controlled with intent.
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Built for */}
      <section className="container-page mt-24">
        <SectionHeading
          eyebrow="Built for"
          title="Creators of"
          highlight="every kind"
        />

        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {audience.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
            >
              <GlassCard className="text-center py-8">
                <a.icon size={28} className="mx-auto text-neon-cyan mb-3" />
                <div className="font-medium text-sm">{a.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="container-page mt-24">
        <SectionHeading
          eyebrow="Under the hood"
          title="Tech that"
          highlight="powers it"
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(techStack).map(([cat, list], i) => (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <GlassCard className="h-full">
                <h4 className="font-display font-semibold mb-3 text-neon-cyan">{cat}</h4>
                <ul className="space-y-1.5">
                  {list.map((t) => (
                    <li key={t} className="text-sm text-slate-300">{t}</li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Supported media */}
      <section className="container-page mt-24">
        <SectionHeading
          eyebrow="Compatibility"
          title="Works with the"
          highlight="formats you have"
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {Object.entries(supportedMedia).map(([type, formats], i) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <GlassCard className="text-center">
                <div className="text-sm text-slate-400 mb-3">{type}</div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {formats.map((f) => (
                    <span
                      key={f}
                      className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 font-mono"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      <CTASection />
    </>
  );
}
