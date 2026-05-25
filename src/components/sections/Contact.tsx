import { motion } from 'framer-motion';
import {
  Github,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Send,
} from 'lucide-react';
import { useState } from 'react';
import { profile } from '@/data/profile';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';

type Status = 'idle' | 'sending' | 'sent' | 'error';

type InfoItem = {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
};

const infoItems: InfoItem[] = [
  {
    icon: Mail,
    label: 'Email',
    value: profile.email,
    href: profile.socials.email,
  },
  {
    icon: MapPin,
    label: 'Location',
    value: profile.location,
  },
  {
    icon: Phone,
    label: 'Phone',
    value: profile.phone,
    href: `tel:${profile.phone.replace(/\s/g, '')}`,
  },
];

export function Contact() {
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    setStatus('sending');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('sent');
      setMessage('Message sent — I’ll reply soon.');
      form.reset();
    } catch {
      setStatus('error');
      setMessage(
        'Something went wrong — please email me directly at ' + profile.email,
      );
    }
  };

  return (
    <section id="contact" className="relative py-16 md:py-24 lg:py-32">
      <div className="container-wide">
        <SectionHeading
          eyebrow="05 — Get In Touch"
          title={
            <>
              Let's <span className="text-gradient">connect</span>
            </>
          }
          subtitle="Have a project in mind, a role to discuss, or just want to say hi? My inbox is open."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <GlassCard className="h-full space-y-5">
              {infoItems.map((info) => {
                const content = (
                  <>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70">
                      <info.icon className="h-4 w-4 text-accent-300" />
                    </span>
                    <div className="text-left">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
                        {info.label}
                      </p>
                      <p className="text-sm font-medium">{info.value}</p>
                    </div>
                  </>
                );
                return info.href ? (
                  <a
                    key={info.label}
                    href={info.href}
                    className="flex items-center gap-4 rounded-xl px-2 py-1 transition hover:bg-[rgb(var(--surface-2))]/50"
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={info.label}
                    className="flex items-center gap-4 px-2 py-1"
                  >
                    {content}
                  </div>
                );
              })}

              <div className="divider-line" />

              <div className="flex items-center gap-3">
                <a
                  href={profile.socials.github}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border))] transition hover:border-accent-400/60 hover:text-accent-300"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href={profile.socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border))] transition hover:border-accent-400/60 hover:text-accent-300"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a
                  href={profile.socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border))] transition hover:border-accent-400/60 hover:text-accent-300"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href={profile.socials.email}
                  className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border))] transition hover:border-accent-400/60 hover:text-accent-300"
                  aria-label="Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </GlassCard>
          </Reveal>

          <Reveal className="lg:col-span-3" delay={0.1}>
            <GlassCard className="h-full">
              <form className="space-y-4" onSubmit={onSubmit} noValidate>
                <input
                  type="hidden"
                  name="access_key"
                  value="8f246b3b-eed4-4e6c-924f-799660d38022"
                />
                <input type="hidden" name="from_name" value="Devlytics" />
                <input
                  type="checkbox"
                  name="botcheck"
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ display: 'none' }}
                  defaultChecked={false}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted"
                      htmlFor="name"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      required
                      placeholder="Your name"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label
                      className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted"
                    htmlFor="subject"
                  >
                    Subject
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    placeholder="What's this about?"
                    className="input-field"
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted"
                    htmlFor="message"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    placeholder="Tell me about your project…"
                    className="input-field resize-none"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn-primary w-full disabled:opacity-70"
                >
                  {status === 'sending' ? 'Sending…' : 'Send Message'}
                  <Send className="h-4 w-4" />
                </motion.button>

                {message && (
                  <p
                    className={`text-center text-sm ${
                      status === 'error' ? 'text-pink-400' : 'text-accent-300'
                    }`}
                  >
                    {message}
                  </p>
                )}
              </form>
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
