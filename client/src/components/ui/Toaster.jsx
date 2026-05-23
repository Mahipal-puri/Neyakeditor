import { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

const ToastCtx = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message, opts = {}) => {
      const id = nextId++;
      const type = opts.type ?? 'info';
      const duration = opts.duration ?? 3200;
      setToasts((t) => [...t, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100%-2rem)] pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const icons = {
    success: <CheckCircle2 size={18} className="text-emerald-300" />,
    info: <Info size={18} className="text-neon-cyan" />,
    warning: <AlertTriangle size={18} className="text-amber-300" />,
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      role="status"
      className="pointer-events-auto glass-strong shadow-glow rounded-xl px-4 py-3 flex items-start gap-3"
    >
      <span className="mt-0.5">{icons[toast.type] ?? icons.info}</span>
      <p className="flex-1 text-sm text-slate-100 leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-slate-400 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    return { toast: () => {}, dismiss: () => {} };
  }
  return ctx;
}
