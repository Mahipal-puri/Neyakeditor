import { motion } from 'framer-motion';
import { Mail, MessageCircle, MapPin, Twitter, Instagram, Github, Youtube } from 'lucide-react';
import SectionHeading from '../components/ui/SectionHeading';
import GlassCard from '../components/ui/GlassCard';
import ContactForm from '../components/sections/ContactForm';
import { useToast } from '../components/ui/Toaster';

const socials = [
  { icon: Twitter, label: 'Twitter' },
  { icon: Instagram, label: 'Instagram' },
  { icon: Youtube, label: 'YouTube' },
  { icon: Github, label: 'GitHub' },
];

export default function Contact() {
  const { toast } = useToast();

  const channels = [
    {
      icon: Mail,
      label: 'Email us',
      value: 'hello@neyakeditor.ai',
      href: 'mailto:hello@neyakeditor.ai',
    },
    {
      icon: MessageCircle,
      label: 'Live chat',
      value: 'Mon – Fri · 9:00 to 18:00 UTC',
      onClick: () =>
        toast('Live chat opens at public beta. Drop a message in the form and we’ll reply within 24h.'),
    },
    {
      icon: MapPin,
      label: 'HQ',
      value: 'Remote-first · worldwide',
      onClick: () =>
        toast('We’re a fully remote team across 7 timezones — no office to visit yet.'),
    },
  ];

  return (
    <>
      <header className="pt-36 pb-12 container-page">
        <SectionHeading
          eyebrow="Contact"
          title="Let's build"
          highlight="something together"
          description="Question, bug, partnership, or just curious? Drop a line — we read every message."
        />
      </header>

      <section className="container-page">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Channels */}
          <div className="lg:col-span-5 space-y-4">
            {channels.map((c, i) => {
              const inner = (
                <GlassCard className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-grad-neon flex items-center justify-center shadow-glow-cyan flex-shrink-0">
                    <c.icon size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-400">
                      {c.label}
                    </div>
                    <div className="font-medium">{c.value}</div>
                  </div>
                </GlassCard>
              );
              return c.href ? (
                <motion.a
                  key={c.label}
                  href={c.href}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="block"
                >
                  {inner}
                </motion.a>
              ) : (
                <motion.button
                  key={c.label}
                  type="button"
                  onClick={c.onClick}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4 }}
                  className="block w-full text-left"
                >
                  {inner}
                </motion.button>
              );
            })}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <GlassCard>
                <div className="text-sm text-slate-300 mb-3">Find us on</div>
                <div className="flex gap-3">
                  {socials.map((s) => (
                    <button
                      type="button"
                      key={s.label}
                      onClick={() =>
                        toast(
                          `Our ${s.label} channel launches with the public beta. Thanks for the love!`
                        )
                      }
                      aria-label={s.label}
                      className="w-10 h-10 rounded-lg glass flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <s.icon size={18} />
                    </button>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <ContactForm />
            </motion.div>
          </div>
        </div>
      </section>

      <div className="mt-24" />
    </>
  );
}
