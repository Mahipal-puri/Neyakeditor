import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import GlassCard from '../ui/GlassCard';
import NeonButton from '../ui/NeonButton';
import { pricingPlans } from '../../data/pricing';

export default function PricingTable() {
  const single = pricingPlans.length === 1;

  return (
    <div
      className={`mt-14 grid gap-6 ${
        single ? 'grid-cols-1 max-w-lg mx-auto' : 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
      }`}
    >
      {pricingPlans.map((p, i) => (
        <motion.div
          key={p.name}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
        >
          <GlassCard
            glow={p.highlight ? 'cyan' : 'none'}
            hover={false}
            className={`h-full flex flex-col ${
              p.highlight
                ? 'border-neon-cyan/40 bg-gradient-to-b from-neon-purple/10 to-transparent shadow-glow-cyan'
                : ''
            }`}
          >
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-2xl font-display font-semibold">{p.name}</h3>
              {p.badge && (
                <span className="px-2.5 py-1 text-xs rounded-full bg-grad-neon text-white font-semibold">
                  {p.badge}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold">{p.price}</span>
              <span className="text-sm text-slate-400">/ {p.period}</span>
            </div>
            <p className="text-sm text-slate-400 mb-6">{p.tagline}</p>

            <ul className="space-y-3 mb-8 flex-1">
              {p.features.map((f) => (
                <li key={f.text} className="flex items-start gap-2 text-sm">
                  {f.included ? (
                    <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-neon-cyan/15 flex items-center justify-center">
                      <Check size={12} className="text-neon-cyan" />
                    </span>
                  ) : (
                    <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center">
                      <X size={12} className="text-slate-500" />
                    </span>
                  )}
                  <span className={f.included ? 'text-slate-200' : 'text-slate-500 line-through'}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <NeonButton
              variant="primary"
              to={p.ctaTo ?? '/contact'}
              className="w-full justify-center"
            >
              {p.cta}
            </NeonButton>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}
