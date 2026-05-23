import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import NeonButton from '../ui/NeonButton';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/editor', label: 'Editor' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/showcase', label: 'AI Showcase' },
  { to: '/templates', label: 'Templates' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'backdrop-blur-glass bg-bg-950/70 border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <nav
        className="container-page flex items-center justify-between h-16"
        aria-label="Primary"
      >
        <Link
          to="/"
          className="flex items-center gap-2 font-display font-bold text-lg"
        >
          <Logo />
          <span>
            Neyak<span className="text-gradient">Editor</span>
          </span>
        </Link>

        <ul className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'text-white bg-white/5'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex items-center gap-3">
          <NeonButton variant="ghost" size="sm" to="/contact">
            Sign in
          </NeonButton>
          <NeonButton size="sm" to="/editor">
            Open editor
          </NeonButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden p-2 rounded-lg glass"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-white/10 bg-bg-950/95 backdrop-blur-glass"
          >
            <ul className="container-page py-4 flex flex-col gap-1">
              {navLinks.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-lg ${
                        isActive
                          ? 'text-white bg-white/5'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
              <li className="flex gap-3 mt-3">
                <NeonButton variant="ghost" size="sm" to="/contact" className="flex-1">
                  Sign in
                </NeonButton>
                <NeonButton size="sm" to="/editor" className="flex-1">
                  Open editor
                </NeonButton>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="navg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#0a0b1a" />
      <path
        d="M16 46 V18 L48 46 V18"
        stroke="url(#navg)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="48" cy="18" r="4" fill="#22d3ee" />
      <circle cx="16" cy="46" r="4" fill="#ec4899" />
    </svg>
  );
}
