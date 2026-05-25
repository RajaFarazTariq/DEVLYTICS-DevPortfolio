import { motion } from 'framer-motion';
import { BarChart3, BrainCircuit, Code2 } from 'lucide-react';
import { profile } from '@/data/profile';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Marquee } from '@/components/ui/Marquee';

const pillars = [
  {
    icon: Code2,
    title: 'Web Development',
    desc: 'React, TypeScript, Django and Node — full-stack apps, real-time systems, and clean REST APIs.',
    accent: 'from-accent-500/30 to-violet-500/30',
    iconColor: 'text-accent-300',
  },
  {
    icon: BarChart3,
    title: 'Data Analytics',
    desc: 'Pandas, SQL and Zoho Analytics — dashboards, ETL pipelines and automation that replace spreadsheets.',
    accent: 'from-violet-500/30 to-pink-500/30',
    iconColor: 'text-violet-300',
  },
  {
    icon: BrainCircuit,
    title: 'AI & Computer Vision',
    desc: 'OpenCV, YOLOv9, Mediapipe and LLM APIs — production-ready vision and language pipelines.',
    accent: 'from-pink-500/30 to-amber-500/30',
    iconColor: 'text-pink-300',
  },
];

export function About() {
  return (
    <section id="about" className="relative pt-16 pb-10 md:pt-24 md:pb-12 lg:pt-32 lg:pb-14">
      <div className="container-wide">
        <SectionHeading
          eyebrow="01 — Introduction"
          title={
            <>
              About <span className="text-gradient">Me</span>
            </>
          }
          subtitle="A full-stack engineer who treats data as a first-class citizen — and ships software that learns from it."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <GlassCard className="h-full">
              <h3 className="font-display text-xl font-semibold md:text-2xl">
                Developer. Analyst. Innovator.
              </h3>
              <p className="mt-4 leading-relaxed text-soft">
                I'm a full-stack developer and data analyst who loves building
                products end-to-end — from designing reliable APIs and
                pixel-perfect UIs to wrangling messy datasets into dashboards
                that actually move the needle. I work across the JavaScript and
                Python ecosystems and have hands-on exposure to modern AI/ML
                tooling.
              </p>
              <p className="mt-4 leading-relaxed text-soft">
                My favourite kind of project sits at the intersection of
                engineering and insight: shipping software that not only works
                at scale, but actively learns from the data it produces.
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {profile.stats.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/40 p-4"
                  >
                    <p className="font-display text-2xl font-bold text-gradient sm:text-3xl">
                      <AnimatedCounter to={s.value} suffix={s.suffix} />
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted sm:text-xs sm:tracking-[0.18em]">
                      {s.label}
                    </p>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </Reveal>

          <div className="grid gap-4 lg:col-span-2">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.1}>
                <GlassCard padded={false} className="overflow-hidden">
                  <div className="flex items-start gap-4 p-5">
                    <div
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${p.accent} ring-1 ring-white/10`}
                    >
                      <p.icon className={`h-5 w-5 ${p.iconColor}`} />
                    </div>
                    <div>
                      <h4 className="font-display text-base font-semibold">
                        {p.title}
                      </h4>
                      <p className="mt-1 text-sm text-soft">{p.desc}</p>
                    </div>
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Tech marquee */}
        <Reveal className="mt-14">
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
            Tools & Technologies
          </p>
          <div className="mt-6">
            <Marquee />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
