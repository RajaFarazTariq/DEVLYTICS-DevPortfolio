import { lazy, Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Github, Instagram, Linkedin, Mail } from 'lucide-react';
import { profile } from '@/data/profile';
import { fadeUp, staggerContainer } from '@/utils/motion';

const HeroScene = lazy(() =>
  import('@/components/three/HeroScene').then((m) => ({ default: m.HeroScene })),
);

function TypedRole() {
  const [index, setIndex] = useState(0);
  const [sub, setSub] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = profile.roles[index];
    const step = deleting ? 35 : 65;
    const t = window.setTimeout(() => {
      if (!deleting) {
        const next = word.slice(0, sub.length + 1);
        setSub(next);
        if (next === word) {
          window.setTimeout(() => setDeleting(true), 1400);
        }
      } else {
        const next = word.slice(0, sub.length - 1);
        setSub(next);
        if (next.length === 0) {
          setDeleting(false);
          setIndex((i) => (i + 1) % profile.roles.length);
        }
      }
    }, step);
    return () => window.clearTimeout(t);
  }, [sub, deleting, index]);

  return (
    <span className="font-mono text-base text-cyan-300 md:text-lg">
      {sub}
      <span className="ml-0.5 inline-block h-5 w-[2px] -translate-y-0.5 animate-pulse bg-cyan-300 align-middle" />
    </span>
  );
}

function LiveIndicator() {
  return (
    <span className="relative inline-grid h-6 w-6 place-items-center">
      <span className="absolute inset-0 rounded-full border-2 border-cyan-400/80" />
      <span className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping" />
      <span className="block h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
    </span>
  );
}

export function Hero() {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden pt-24 md:pt-28">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.10),transparent_60%)] blur-3xl" />
      </div>

      <div className="container-wide grid min-h-[calc(100vh-7rem)] items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <motion.div
          variants={staggerContainer(0.1)}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUp} className="chip-cyan">
            <span className="block h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
            {profile.tagline}
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mt-7 font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
          >
            <span className="text-gradient-cyan">Dev</span>
            <span className="text-[rgb(var(--fg))]">lytics</span>
          </motion.h1>

          <motion.div
            variants={fadeUp}
            className="mt-5 flex items-center gap-3"
          >
            <span className="font-mono text-base text-muted md:text-lg">
              {'> '}
            </span>
            <TypedRole />
            <LiveIndicator />
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-base leading-relaxed text-soft md:text-lg"
          >
            {profile.summary}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-3">
            <a href="#projects" className="btn-cyan group">
              View Projects
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>
            <a href="#contact" className="btn-ghost">
              Contact Me
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex items-center gap-5 text-muted"
          >
            <a
              href={profile.socials.email}
              className="transition hover:text-cyan-300"
              aria-label="Email"
            >
              <Mail className="h-5 w-5" />
            </a>
            <a
              href={profile.socials.github}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-cyan-300"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <a
              href={profile.socials.linkedin}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-cyan-300"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href={profile.socials.instagram}
              target="_blank"
              rel="noreferrer"
              className="transition hover:text-cyan-300"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </motion.div>
        </motion.div>

        {/* 3D scene */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative hidden h-[460px] lg:block lg:h-[560px]"
        >
          <Suspense
            fallback={
              <div className="grid h-full w-full place-items-center text-sm text-muted">
                Loading 3D scene…
              </div>
            }
          >
            <HeroScene />
          </Suspense>
        </motion.div>
      </div>

      <a
        href="#about"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted transition hover:text-cyan-300"
      >
        ↓ Scroll
      </a>
    </section>
  );
}
