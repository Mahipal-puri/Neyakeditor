import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import GlassCard from '../ui/GlassCard';
import { aiModels } from '../../data/aiModels';

export default function AIModelsTable() {
  return (
    <section className="py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Under the hood"
          title="Powered by best-in-class"
          highlight="AI models"
          description="Each feature is backed by a model purpose-built for the job, orchestrated through a single fluid interface."
        />

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiModels.map((m, i) => (
            <motion.div
              key={m.feature}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.45 }}
            >
              <GlassCard className="h-full">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center mb-4`}
                >
                  <Cpu size={18} className="text-white" />
                </div>
                <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
                  {m.feature}
                </div>
                <div className="font-display font-semibold text-lg">
                  {m.model}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
