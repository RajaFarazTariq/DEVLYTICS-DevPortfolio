import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Github,
  Pause,
  Play,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { projects } from '@/data/projects';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { cn } from '@/utils/cn';

const ROTATE_INTERVAL_MS = 5500;

export function Projects() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  const goTo = useCallback((i: number, dir: 1 | -1) => {
    setDirection(dir);
    setIndex((i + projects.length) % projects.length);
  }, []);

  const next = useCallback(
    () => goTo(index + 1, 1),
    [index, goTo],
  );
  const prev = useCallback(
    () => goTo(index - 1, -1),
    [index, goTo],
  );

  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % projects.length);
    }, ROTATE_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [paused]);

  const project = projects[index];

  const slideVariants = {
    enter: (dir: 1 | -1) => ({
      opacity: 0,
      x: dir * 40,
      scale: 0.98,
    }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: 1 | -1) => ({
      opacity: 0,
      x: dir * -40,
      scale: 0.98,
    }),
  } as const;

  return (
    <section id="projects" className="relative py-16 md:py-24 lg:py-32">
      <div className="container-wide">
        <SectionHeading
          eyebrow="03 — Featured Work"
          title={
            <>
              Selected <span className="text-gradient">Projects</span>
            </>
          }
          subtitle="A rotating spotlight on recent work. Click to pause — auto-resumes never."
        />

        <div
          className="relative mt-14"
          onClick={() => setPaused((p) => !p)}
          role="region"
          aria-label="Projects carousel"
        >
          {/* Stage */}
          <div className="relative overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/40 p-3 md:p-4">
            {/* gradient frame */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-accent-500/10 via-transparent to-violet-500/10" />
            <div className="relative grid min-h-[360px] gap-0 md:grid-cols-2 md:min-h-[380px]">
              <AnimatePresence custom={direction} mode="wait">
                <motion.article
                  key={project.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  className="contents"
                >
                  {/* Visual */}
                  <div
                    className="relative m-1 overflow-hidden rounded-2xl bg-[rgb(var(--surface-2))] md:m-2"
                    style={
                      project.imageBg
                        ? { backgroundColor: project.imageBg }
                        : undefined
                    }
                  >
                    <img
                      src={project.image}
                      alt={`${project.title} preview`}
                      loading="lazy"
                      decoding="async"
                      width={1200}
                      height={750}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          'none';
                      }}
                      className="relative h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                    <div className="absolute left-4 top-4">
                      <span className="rounded-full bg-black/50 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/90 backdrop-blur">
                        {project.category}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                      <span className="font-mono text-xs opacity-70">
                        {String(index + 1).padStart(2, '0')} /{' '}
                        {String(projects.length).padStart(2, '0')}
                      </span>
                      <span className="flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1 text-[11px] backdrop-blur">
                        {paused ? (
                          <>
                            <Pause className="h-3 w-3" /> Paused
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" /> Auto-rotating
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col justify-center p-5 md:p-8">
                    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-accent-300">
                      {project.summary}
                    </p>
                    <h3 className="mt-2.5 font-display text-xl font-bold leading-tight md:text-3xl">
                      {project.title}
                    </h3>
                    {project.subtitle && (
                      <p className="mt-1 font-display text-sm font-medium text-soft md:text-base">
                        {project.subtitle}
                      </p>
                    )}
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-soft md:text-base">
                      {project.description}
                    </p>

                    <ul className="mt-5 flex flex-wrap gap-2">
                      {project.tech.map((t) => (
                        <li
                          key={t}
                          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))]/70 px-3 py-1 font-mono text-[11px] text-soft"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 flex flex-wrap gap-3">
                      {project.links.github && (
                        <a
                          href={project.links.github}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="btn-ghost"
                        >
                          <Github className="h-4 w-4" /> Code
                        </a>
                      )}
                      {project.links.demo && (
                        <a
                          href={project.links.demo}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="btn-primary"
                        >
                          Live Demo <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.article>
              </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-[rgb(var(--surface-2))]">
              <motion.div
                key={`${index}-${paused ? 'p' : 'r'}`}
                initial={{ width: '0%' }}
                animate={{ width: paused ? '0%' : '100%' }}
                transition={{
                  duration: paused ? 0 : ROTATE_INTERVAL_MS / 1000,
                  ease: 'linear',
                }}
                className="h-full bg-gradient-to-r from-accent-500 via-violet-500 to-pink-500"
              />
            </div>
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous project"
                className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/60 transition hover:border-accent-400/60 hover:text-accent-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next project"
                className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/60 transition hover:border-accent-400/60 hover:text-accent-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPaused((p) => !p);
                }}
                aria-label={paused ? 'Resume' : 'Pause'}
                className="ml-2 inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/60 px-4 py-2 text-xs transition hover:border-accent-400/60 hover:text-accent-300"
              >
                {paused ? (
                  <>
                    <Play className="h-3 w-3" /> Play
                  </>
                ) : (
                  <>
                    <Pause className="h-3 w-3" /> Pause
                  </>
                )}
              </button>
            </div>

            {/* Dots */}
            <div className="flex items-center gap-2">
              {projects.map((p, i) => (
                <button
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    goTo(i, i > index ? 1 : -1);
                  }}
                  aria-label={`Go to project ${i + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    i === index
                      ? 'w-8 bg-gradient-to-r from-accent-500 to-violet-500'
                      : 'w-2 bg-[rgb(var(--border))]',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
