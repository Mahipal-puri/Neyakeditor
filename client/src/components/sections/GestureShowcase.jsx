import { motion } from 'framer-motion';
import SectionHeading from '../ui/SectionHeading';
import GlassCard from '../ui/GlassCard';
import { gestures, gestureTech } from '../../data/gestures';

export default function GestureShowcase() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-grad-mesh opacity-30 -z-10" />
      <div className="container-page">
        <SectionHeading
          eyebrow="Gesture-based editing"
          title="Your hands are the"
          highlight="new mouse"
          description="Webcam tracks 21 hand landmarks in real time. Pinch to zoom, swipe to move, grab to drag — no controller required."
        />

        <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Webcam mockup */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5"
          >
            <GlassCard hover={false} className="aspect-[4/5] flex flex-col">
              <div className="flex-1 relative rounded-xl overflow-hidden bg-gradient-to-br from-bg-900 to-bg-800">
                <div className="absolute inset-0 bg-grad-mesh opacity-40" />
                {/* Hand skeleton lines */}
                <svg
                  viewBox="0 0 200 200"
                  className="absolute inset-0 w-full h-full"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="handg" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                  <g
                    stroke="url(#handg)"
                    strokeWidth="1.5"
                    fill="none"
                    opacity="0.85"
                  >
                    {/* Palm */}
                    <path d="M100 150 L80 110 L75 70 M100 150 L95 105 L92 60 M100 150 L110 105 L113 60 M100 150 L122 110 L130 70 M100 150 L70 130 L55 100" />
                  </g>
                  {/* Landmark dots */}
                  {[
                    [100, 150], [80, 110], [75, 70], [95, 105], [92, 60],
                    [110, 105], [113, 60], [122, 110], [130, 70], [70, 130], [55, 100],
                  ].map(([x, y], i) => (
                    <motion.circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#22d3ee"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </svg>

                {/* Camera indicator */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-xs text-rose-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                  REC
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-xs text-slate-300 glass px-3 py-1.5 rounded-lg flex items-center justify-between">
                  <span>Detected: pinch 🤏</span>
                  <span className="text-neon-cyan">confidence 0.94</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {gestureTech.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-slate-300"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Gesture table */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {gestures.map((g, i) => (
              <motion.div
                key={g.gesture}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
              >
                <GlassCard className="flex items-center gap-4">
                  <div className="text-4xl">{g.emoji}</div>
                  <div>
                    <div className="font-semibold">{g.gesture}</div>
                    <div className="text-sm text-slate-400">{g.action}</div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
