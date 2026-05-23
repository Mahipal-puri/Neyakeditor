import { AnimatePresence, motion } from 'framer-motion';

/**
 * Big, brief icon + label that pulses over the canvas when a trigger gesture
 * fires (rotate / flip / preset / reset / remove-bg). Parent controls the
 * visible action via a key — render a new `<ActionFlash action={...} />`
 * each time and the AnimatePresence handles fade-in / fade-out.
 */
export default function ActionFlash({ action }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
      <AnimatePresence>
        {action && (
          <motion.div
            key={action.id}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.15, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-24 h-24 rounded-3xl glass-strong shadow-glow-cyan flex items-center justify-center text-neon-cyan">
              <action.icon size={56} strokeWidth={2.4} />
            </div>
            <span className="px-3 py-1 rounded-full glass-strong text-sm font-semibold text-white shadow-glow">
              {action.label}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
