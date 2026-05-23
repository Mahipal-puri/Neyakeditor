import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const base =
  'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all select-none whitespace-nowrap';

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const variants = {
  primary:
    'bg-grad-neon text-white shadow-glow hover:shadow-glow-strong bg-[length:200%_200%] hover:bg-[position:100%_50%]',
  ghost:
    'glass text-white hover:bg-white/10 border border-white/15',
  outline:
    'border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10',
};

export default function NeonButton({
  children,
  to,
  href,
  size = 'md',
  variant = 'primary',
  className = '',
  ...rest
}) {
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`;
  const inner = (
    <motion.span
      className="inline-flex items-center gap-2"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.span>
  );

  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {inner}
    </button>
  );
}
