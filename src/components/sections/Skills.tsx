import { motion } from 'framer-motion';
import { skillGroups } from '@/data/skills';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';

export function Skills() {
  return (
    <section id="skills" className="relative pt-10 pb-16 md:pt-12 md:pb-24 lg:pt-14 lg:pb-32">
      <div className="container-wide">
        <SectionHeading
          eyebrow="02 — Capabilities"
          title={
            <>
              Skills <span className="text-gradient">Stack</span>
            </>
          }
          subtitle="What I work with day to day — from interface down to data pipeline."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, gIdx) => {
            const Icon = group.icon;
            return (
              <Reveal key={group.id} delay={gIdx * 0.06}>
                <GlassCard className="group h-full" hoverable>
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/60">
                      <Icon className={`h-5 w-5 ${group.accent}`} />
                    </div>
                    <h3 className="font-display text-lg font-semibold">
                      {group.title}
                    </h3>
                  </div>

                  <div className="mt-6 space-y-4">
                    {group.items.map((item, i) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-soft">{item.name}</span>
                          <span className="font-mono text-xs text-muted">
                            {item.level}%
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[rgb(var(--surface-2))]">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.level}%` }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{
                              duration: 1,
                              delay: 0.05 * i,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                            className="h-full rounded-full bg-gradient-to-r from-accent-500 via-violet-500 to-pink-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
