import type { ComponentType, SVGProps } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  BrainCircuit,
  Briefcase,
  Code2,
  GraduationCap,
  MapPin,
} from 'lucide-react';
import { experience, type PillarKey } from '@/data/experience';
import { SectionHeading } from '@/components/ui/SectionHeading';

type IconType = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

const PILLAR_META: Record<
  PillarKey,
  { icon: IconType; text: string; bullet: string; tint: string; border: string }
> = {
  web: {
    icon: Code2,
    text: 'text-cyan-300',
    bullet: 'bg-cyan-400',
    tint: 'from-cyan-500/12 via-transparent to-transparent',
    border: 'border-cyan-400/20',
  },
  data: {
    icon: BarChart3,
    text: 'text-violet-300',
    bullet: 'bg-violet-400',
    tint: 'from-violet-500/12 via-transparent to-transparent',
    border: 'border-violet-400/20',
  },
  ai: {
    icon: BrainCircuit,
    text: 'text-pink-300',
    bullet: 'bg-pink-400',
    tint: 'from-pink-500/12 via-transparent to-transparent',
    border: 'border-pink-400/20',
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function Experience() {
  return (
    <section id="experience" className="relative py-16 md:py-24 lg:py-32">
      <div className="container-wide">
        <SectionHeading
          eyebrow="04 — Journey"
          title={
            <>
              Experience &amp; <span className="text-gradient">Education</span>
            </>
          }
          subtitle="Three disciplines, one engineer. Web, data and AI — shipped end-to-end."
        />

        <div className="mx-auto mt-14 max-w-5xl space-y-6">
          {experience.map((item, idx) => {
            const TopIcon = item.type === 'education' ? GraduationCap : Briefcase;
            return (
              <motion.article
                key={item.id}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                transition={{
                  duration: 0.6,
                  delay: idx * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/45 p-6 backdrop-blur-md md:p-9"
              >
                {/* Subtle accent glow */}
                <div className="pointer-events-none absolute -top-32 -right-24 -z-10 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

                {/* Header */}
                <header className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cyan-400/30 bg-[rgb(var(--surface-2))]/60 shadow-[0_0_24px_-8px_rgba(34,211,238,0.45)]">
                      <TopIcon className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-300">
                        {item.period}
                      </span>
                      <h3 className="mt-1 font-display text-xl font-semibold md:text-2xl">
                        {item.role}
                      </h3>
                      <p className="mt-1 text-sm text-soft">{item.company}</p>
                    </div>
                  </div>

                  {item.location && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </span>
                  )}
                </header>

                {item.summary && (
                  <p className="mt-6 max-w-3xl text-sm leading-relaxed text-soft md:text-base">
                    {item.summary}
                  </p>
                )}

                {/* Three-pillar grid (work) */}
                {item.pillars && (
                  <div className="mt-7 grid gap-4 md:grid-cols-3">
                    {item.pillars.map((p) => {
                      const meta = PILLAR_META[p.key];
                      const Icon = meta.icon;
                      return (
                        <div
                          key={p.key}
                          className={`relative overflow-hidden rounded-2xl border ${meta.border} bg-[rgb(var(--surface-2))]/60 p-5`}
                        >
                          <div
                            className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${meta.tint}`}
                          />
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`grid h-8 w-8 place-items-center rounded-lg border ${meta.border} bg-[rgb(var(--bg-elev))]/50`}
                            >
                              <Icon className={`h-4 w-4 ${meta.text}`} />
                            </span>
                            <h4 className="font-display text-sm font-semibold uppercase tracking-wider">
                              {p.name}
                            </h4>
                          </div>
                          <p className="mt-2 text-xs text-muted">
                            {p.description}
                          </p>

                          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-soft">
                            {p.bullets.map((b, j) => (
                              <li key={j} className="flex gap-2.5">
                                <span
                                  className={`mt-2 inline-block h-1 w-1 shrink-0 rounded-full ${meta.bullet}`}
                                />
                                <span>{b}</span>
                              </li>
                            ))}
                          </ul>

                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {p.stack.map((s) => (
                              <span
                                key={s}
                                className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg-elev))]/50 px-2 py-0.5 font-mono text-[10px] text-muted"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Bullets + stack (education) */}
                {item.bullets && (
                  <ul className="mt-6 space-y-2.5 text-sm leading-relaxed text-soft md:text-base">
                    {item.bullets.map((b, j) => (
                      <li key={j} className="flex gap-2.5">
                        <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {item.stack && !item.pillars && (
                  <div className="mt-6 flex flex-wrap gap-2">
                    {item.stack.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/60 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
