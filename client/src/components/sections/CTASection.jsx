import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import GradientText from '../ui/GradientText';
import NeonButton from '../ui/NeonButton';

export default function CTASection() {
  return (
    <section className="py-24">
      <div className="container-page">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden glass-strong p-10 sm:p-16 text-center"
        >
          <div className="absolute inset-0 bg-grad-mesh opacity-60 -z-10" />
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-neon-purple/30 blur-3xl -z-10" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-neon-cyan/25 blur-3xl -z-10" />

          <h2 className="text-4xl sm:text-5xl font-bold font-display leading-tight max-w-3xl mx-auto">
            Ready to edit{' '}
            <GradientText>beyond reality</GradientText>?
          </h2>
          <p className="mt-5 max-w-xl mx-auto text-slate-300/90">
            Join the waitlist for early access — free credits on launch day for
            anyone who signs up now.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <NeonButton size="lg" to="/editor">
              Open editor <ArrowRight size={18} />
            </NeonButton>
            <NeonButton size="lg" variant="ghost" to="/showcase">
              See what's possible
            </NeonButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
