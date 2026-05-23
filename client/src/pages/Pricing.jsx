import { motion } from 'framer-motion';
import SectionHeading from '../components/ui/SectionHeading';
import GlassCard from '../components/ui/GlassCard';
import PricingTable from '../components/sections/PricingTable';
import CTASection from '../components/sections/CTASection';

const faqs = [
  {
    q: 'Is the Free plan really free?',
    a: 'Yes. You can use AI photo editing, basic filters, and gesture preview without paying anything. Exports include a small watermark.',
  },
  {
    q: 'When does Premium launch?',
    a: 'Premium opens shortly after our public beta. Waitlist members get the first invites and a launch-week discount.',
  },
  {
    q: 'What happens to my projects when I upgrade?',
    a: 'Everything stays. Projects, templates, AI history — all carried over to your Premium account automatically.',
  },
  {
    q: 'Can I use NeyakEditor commercially?',
    a: 'Free outputs are licensed for personal use. Premium grants a commercial license for monetised channels and client work.',
  },
  {
    q: 'Do I need a GPU?',
    a: 'No. All AI inference runs in the cloud — any modern browser with a webcam is enough for gesture editing.',
  },
];

export default function Pricing() {
  return (
    <>
      <header className="pt-36 pb-8 container-page">
        <SectionHeading
          eyebrow="Pricing"
          title="It's free,"
          highlight="forever."
          description="No credit card. No trial timer. Everything you see ships in the free plan — open the editor and start creating."
        />
      </header>

      <section className="container-page">
        <PricingTable />
      </section>

      <section className="container-page mt-24">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions,"
          highlight="answered"
        />

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {faqs.map((f, i) => (
            <motion.div
              key={f.q}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <GlassCard hover={false}>
                <h3 className="font-semibold text-lg mb-2">{f.q}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.a}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      <CTASection />
    </>
  );
}
