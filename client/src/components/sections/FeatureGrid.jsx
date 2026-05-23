import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import SectionHeading from '../ui/SectionHeading';
import { features } from '../../data/features';

export default function FeatureGrid({ limit }) {
  const items = limit ? features.slice(0, limit) : features;

  return (
    <section className="py-24" id="features">
      <div className="container-page">
        <SectionHeading
          eyebrow="What you can do"
          title="Ten ways to"
          highlight="reshape reality"
          description="From AI relighting to gesture-driven layering, NeyakEditor packs an entire studio into one canvas."
        />

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((f, idx) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (idx % 3) * 0.07 }}
            >
              <GlassCard className="h-full" glow="purple">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center shadow-glow-cyan mb-5`}
                >
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {f.short}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
