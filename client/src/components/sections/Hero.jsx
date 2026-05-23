import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import AnimatedBackground from '../ui/AnimatedBackground';
import GradientText from '../ui/GradientText';
import NeonButton from '../ui/NeonButton';

const stats = [
  { value: '50+', label: 'AI tools' },
  { value: '6', label: 'Hand gestures' },
  { value: '4K', label: 'Export quality' },
  { value: '<1s', label: 'AI response' },
];

export default function Hero() {
  return (
    <section className="relative pt-32 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
      <AnimatedBackground />

      <div className="container-page text-center relative">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs sm:text-sm text-neon-cyan border-neon-cyan/30"
        >
          <Sparkles size={14} />
          Now in early access — AI gesture editing is here
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
        >
          Edit Beyond Reality
          <br />
          with{' '}
          <GradientText>AI & Gestures</GradientText>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-slate-300/90 leading-relaxed"
        >
          NeyakEditor is the futuristic AI studio where you upload any photo or
          video and edit it with hand gestures, smart automation, and cinematic
          AI tools.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row justify-center gap-4"
        >
          <NeonButton size="lg" to="/editor">
            Open editor <ArrowRight size={18} />
          </NeonButton>
          <NeonButton size="lg" variant="ghost" to="/showcase">
            <Play size={16} /> Watch demo
          </NeonButton>
        </motion.div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="mt-16 relative max-w-5xl mx-auto"
        >
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden glass-strong shadow-glow-strong">
            {/* Mock editor UI */}
            <div className="absolute inset-0 bg-gradient-to-br from-bg-900 via-bg-800 to-bg-900" />
            <div className="absolute inset-0 bg-grad-mesh opacity-60" />

            {/* Toolbar */}
            <div className="absolute top-0 inset-x-0 h-10 bg-bg-950/70 backdrop-blur-glass border-b border-white/10 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              </div>
              <span className="text-xs text-slate-400 ml-3 hidden sm:block">
                neyak.studio / editor — untitled.jpg
              </span>
            </div>

            {/* Side panel */}
            <div className="absolute top-10 left-0 bottom-0 w-14 sm:w-16 bg-bg-950/60 backdrop-blur-glass border-r border-white/10 flex flex-col items-center py-4 gap-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-lg ${
                    i === 2 ? 'bg-grad-neon shadow-glow-cyan' : 'glass'
                  }`}
                />
              ))}
            </div>

            {/* Canvas with floating hand cursor */}
            <div className="absolute inset-0 pt-10 pl-14 sm:pl-16 pr-0 flex items-center justify-center">
              <div className="relative w-2/3 aspect-square rounded-2xl bg-gradient-to-br from-neon-purple/50 via-neon-pink/40 to-neon-cyan/40 shadow-glow">
                <motion.div
                  className="absolute"
                  animate={{ x: [0, 60, 0, -40, 0], y: [0, 30, 60, 30, 0] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ left: '40%', top: '40%' }}
                >
                  <div className="text-3xl drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]">
                    🤏
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Bottom timeline */}
            <div className="absolute bottom-0 inset-x-0 h-12 bg-bg-950/70 backdrop-blur-glass border-t border-white/10 flex items-center px-4 gap-1.5">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-white/10"
                  style={{ height: `${20 + ((i * 7) % 60)}%` }}
                />
              ))}
            </div>
          </div>

          {/* Floating badges */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-4 -left-4 sm:-left-8 px-4 py-2 rounded-2xl glass-strong text-sm shadow-glow-cyan hidden sm:flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse" />
            Live gesture tracking
          </motion.div>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-4 -right-4 sm:-right-8 px-4 py-2 rounded-2xl glass-strong text-sm shadow-glow-pink hidden sm:flex items-center gap-2"
          >
            <Sparkles size={14} className="text-neon-pink" />
            AI processing in 800ms
          </motion.div>
        </motion.div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 * i, duration: 0.5 }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl font-bold font-display text-gradient">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1">
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
