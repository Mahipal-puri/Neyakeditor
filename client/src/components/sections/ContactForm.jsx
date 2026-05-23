import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2 } from 'lucide-react';
import GlassCard from '../ui/GlassCard';

export default function ContactForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSent(true);
      e.target.reset();
      setTimeout(() => setSent(false), 4000);
    }, 700);
  };

  return (
    <GlassCard hover={false} className="p-8">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Your name" name="name" type="text" required />
          <Field label="Email" name="email" type="email" required />
        </div>
        <Field label="Subject" name="subject" type="text" required />
        <Field
          label="Message"
          name="message"
          textarea
          required
          rows={5}
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-grad-neon text-white font-semibold shadow-glow hover:shadow-glow-strong transition-shadow disabled:opacity-60"
        >
          {submitting ? 'Sending…' : (<>Send message <Send size={16} /></>)}
        </button>

        <AnimatePresence>
          {sent && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-2 text-sm text-emerald-300"
              role="status"
            >
              <CheckCircle2 size={16} />
              Thanks — we'll get back within 24 hours.
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </GlassCard>
  );
}

function Field({ label, name, type = 'text', textarea, rows, ...rest }) {
  const cls =
    'w-full px-4 py-3 rounded-xl glass text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/40 focus:border-neon-cyan/40';
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
      </span>
      {textarea ? (
        <textarea name={name} rows={rows} className={cls} {...rest} />
      ) : (
        <input type={type} name={name} className={cls} {...rest} />
      )}
    </label>
  );
}
