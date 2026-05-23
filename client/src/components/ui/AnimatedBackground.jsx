import { motion, useReducedMotion } from 'framer-motion';

export default function AnimatedBackground({ variant = 'mesh' }) {
  const reduce = useReducedMotion();

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated mesh gradient */}
      <div
        className="absolute inset-0 bg-grad-mesh opacity-90"
        style={{ backgroundSize: '200% 200%' }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse at center, black 0%, transparent 75%)',
        }}
      />

      {/* Floating orbs */}
      {variant === 'mesh' && !reduce && (
        <>
          <motion.div
            className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-neon-purple/30 blur-3xl"
            animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 -right-32 w-[28rem] h-[28rem] rounded-full bg-neon-cyan/25 blur-3xl"
            animate={{ y: [0, -40, 0], x: [0, -20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-neon-pink/20 blur-3xl"
            animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Top fade for nav legibility */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-bg-950 to-transparent" />
      {/* Bottom fade into page content */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg-950 to-transparent" />
    </div>
  );
}
