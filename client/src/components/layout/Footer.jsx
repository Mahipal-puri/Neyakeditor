import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Youtube, Github, Send } from 'lucide-react';
import GradientText from '../ui/GradientText';
import { useToast } from '../ui/Toaster';

const cols = [
  {
    title: 'Product',
    links: [
      { to: '/features', label: 'Features' },
      { to: '/pricing', label: 'Pricing' },
      { to: '/showcase', label: 'AI Showcase' },
      { to: '/templates', label: 'Templates' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About' },
      { to: '/contact', label: 'Contact' },
      { to: '/contact', label: 'Careers' },
      { to: '/contact', label: 'Press' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { to: '/showcase', label: 'AI models' },
      { to: '/features', label: 'Gesture guide' },
      { to: '/contact', label: 'Changelog' },
      { to: '/contact', label: 'Support' },
    ],
  },
];

const socials = [
  { icon: Twitter, label: 'Twitter' },
  { icon: Instagram, label: 'Instagram' },
  { icon: Youtube, label: 'YouTube' },
  { icon: Github, label: 'GitHub' },
];

const legal = ['Privacy', 'Terms', 'Cookies'];

export default function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  const onSubscribe = (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    toast(`You're on the list — we'll email ${value} when we launch.`, { type: 'success' });
    setEmail('');
  };

  const onSocial = (label) => () =>
    toast(`Our ${label} channel launches with the public beta. Thanks for the love!`);

  const onLegal = (label) => () =>
    toast(`${label} policy is being finalised with our legal team — coming soon.`);

  return (
    <footer className="mt-32 border-t border-white/10 bg-bg-950/60 backdrop-blur-glass">
      <div className="container-page py-16 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-4">
          <Link to="/" className="font-display font-bold text-xl">
            Neyak<GradientText>Editor</GradientText>
          </Link>
          <p className="mt-3 text-sm text-slate-400 max-w-sm leading-relaxed">
            The all-in-one AI creative studio. Edit photos and videos with hand
            gestures, transform fashion, generate animations, and build avatars.
          </p>

          <form
            onSubmit={onSubscribe}
            className="mt-6 flex max-w-sm gap-2"
            aria-label="Subscribe to updates"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-4 py-2.5 rounded-xl glass text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/40"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-grad-neon text-white text-sm font-semibold inline-flex items-center gap-1 hover:shadow-glow transition-shadow"
            >
              <Send size={14} /> Notify
            </button>
          </form>
        </div>

        {cols.map((col) => (
          <div key={col.title} className="md:col-span-2">
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-300 mb-3">
              {col.title}
            </h4>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="md:col-span-2">
          <h4 className="font-display font-semibold text-sm uppercase tracking-wider text-slate-300 mb-3">
            Follow
          </h4>
          <ul className="flex gap-3">
            {socials.map((s) => (
              <li key={s.label}>
                <button
                  type="button"
                  onClick={onSocial(s.label)}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <s.icon size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} NeyakEditor. All rights reserved.</span>
          <span className="flex gap-4">
            {legal.map((l) => (
              <button
                key={l}
                type="button"
                onClick={onLegal(l)}
                className="hover:text-white transition-colors"
              >
                {l}
              </button>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
