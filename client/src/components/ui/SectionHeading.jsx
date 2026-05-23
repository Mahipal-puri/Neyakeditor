import { motion } from 'framer-motion';
import GradientText from './GradientText';

export default function SectionHeading({
  eyebrow,
  title,
  highlight,
  description,
  align = 'center',
  className = '',
}) {
  const alignCls =
    align === 'center'
      ? 'text-center mx-auto'
      : align === 'right'
      ? 'text-right ml-auto'
      : 'text-left';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`max-w-3xl ${alignCls} ${className}`}
    >
      {eyebrow && (
        <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider uppercase rounded-full glass text-neon-cyan border-neon-cyan/30">
          {eyebrow}
        </span>
      )}
      <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
        {title}{' '}
        {highlight && <GradientText>{highlight}</GradientText>}
      </h2>
      {description && (
        <p className="text-lg text-slate-300/90 leading-relaxed">{description}</p>
      )}
    </motion.div>
  );
}
