import { motion } from 'framer-motion';

export default function GlassCard({
  children,
  className = '',
  hover = true,
  glow = 'purple',
  as: Tag = 'div',
  ...rest
}) {
  const glowMap = {
    purple: 'hover:shadow-glow',
    cyan: 'hover:shadow-glow-cyan',
    pink: 'hover:shadow-glow-pink',
    none: '',
  };

  // motion[Tag] is the pre-built, *stable* motion component for built-in HTML
  // tags. The previous `motion(Tag)` created a fresh component class on every
  // render — React saw it as a different type and unmounted the entire subtree
  // each parent re-render, which killed the GestureCamera <video> + MediaStream
  // every time a gesture fired a state update.
  const MotionTag = motion[Tag] ?? motion.div;

  return (
    <MotionTag
      whileHover={hover ? { y: -6 } : undefined}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      className={`relative rounded-2xl glass p-6 transition-shadow duration-300 ${glowMap[glow]} ${className}`}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
