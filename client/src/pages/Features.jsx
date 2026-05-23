import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import SectionHeading from '../components/ui/SectionHeading';
import GlassCard from '../components/ui/GlassCard';
import CTASection from '../components/sections/CTASection';
import { features } from '../data/features';

export default function Features() {
  return (
    <>
      <header className="pt-36 pb-12 text-center container-page">
        <SectionHeading
          eyebrow="The complete toolkit"
          title="Every tool you need,"
          highlight="powered by AI"
          description="Ten production-ready capabilities, each backed by a purpose-built AI model and unified under one fluid workspace."
        />
      </header>

      <div className="container-page space-y-24 pb-12">
        {features.map((f, idx) => {
          const reverse = idx % 2 === 1;
          return (
            <motion.section
              key={f.id}
              id={f.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${
                reverse ? 'lg:[&>*:first-child]:order-2' : ''
              }`}
            >
              {/* Visual */}
              <div>
                <GlassCard hover={false} className="aspect-[4/3] p-0 overflow-hidden">
                  <div
                    className={`w-full h-full bg-gradient-to-br ${f.accent} relative`}
                  >
                    <div
                      className="absolute inset-0 mix-blend-overlay opacity-50"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 30% 30%, white 0%, transparent 50%)',
                      }}
                    />
                    <div className="absolute inset-0 bg-grad-mesh opacity-40" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <f.icon size={96} className="text-white/90 drop-shadow-2xl" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 glass px-3 py-2 rounded-lg text-xs text-slate-200">
                      Preview · {f.title}
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Copy */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-neon-cyan border-neon-cyan/30 mb-4">
                  Feature {String(idx + 1).padStart(2, '0')}
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
                  {f.title}
                </h2>
                <p className="text-slate-300/90 leading-relaxed mb-6">
                  {f.short}
                </p>
                <ul className="space-y-2.5">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2.5 text-slate-200">
                      <span className="w-5 h-5 rounded-full bg-neon-cyan/15 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-neon-cyan" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.section>
          );
        })}
      </div>

      <CTASection />
    </>
  );
}
