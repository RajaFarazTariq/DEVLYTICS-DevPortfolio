import { motion } from 'framer-motion';
import { profile } from '@/data/profile';
import { about, pillarTones } from '@/data/about';
import { sections } from '@/data/settings';
import { skillIcons } from '@/data/skillIcons';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading, headingProps } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Marquee } from '@/components/ui/Marquee';

// Discipline cards come from src/content/about.json (managed from /admin).
const pillars = about.pillars.map((p) => ({
  icon: skillIcons[p.icon] ?? skillIcons.Code2,
  title: p.title,
  desc: p.description,
  ...(pillarTones[p.tone] ?? pillarTones.blue),
}));

export function About() {
  return (
    <section id="about" className="relative pt-16 pb-10 md:pt-24 md:pb-12 lg:pt-32 lg:pb-14">
      <div className="container-wide">
        <SectionHeading {...headingProps(sections.about)} />

        <div className="mt-14 grid gap-6 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <GlassCard className="h-full">
              <h3 className="font-display text-xl font-semibold md:text-2xl">
                {about.heading}
              </h3>
              {about.paragraphs.map((text, i) => (
                <p key={i} className="mt-4 leading-relaxed text-soft">
                  {text}
                </p>
              ))}

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
            {about.marqueeLabel}
          </p>
          <div className="mt-6">
            <Marquee />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
