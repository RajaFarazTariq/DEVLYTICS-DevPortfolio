import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { LoadingScene } from '@/components/three/LoadingScene';

export function LoadingScreen() {
  const progress = useMotionValue(0);
  const widthPct = useTransform(progress, (v) => `${v}%`);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(progress, 100, {
      duration: 2.8,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [progress]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[#06081a]"
      aria-busy="true"
      aria-live="polite"
    >
      {/* Background atmospheric layers */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.14),transparent_55%),radial-gradient(circle_at_15%_90%,rgba(167,139,250,0.08),transparent_55%),radial-gradient(circle_at_85%_10%,rgba(236,72,153,0.06),transparent_55%)]" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      {/* 3D core */}
      <motion.div
        initial={{ scale: 0.72, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-56 w-56 md:h-72 md:w-72"
      >
        <LoadingScene />
      </motion.div>

      {/* Brand */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 flex flex-col items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl border-2 border-cyan-400/80 font-mono text-sm font-bold text-white shadow-[0_0_22px_-2px_rgba(34,211,238,0.45)]">
            D
            <span className="pointer-events-none absolute inset-0 -z-10 rounded-xl bg-cyan-400/15 blur-md" />
          </span>
          <span className="font-mono text-base font-semibold tracking-tight md:text-lg">
            <span className="text-cyan-400">&lt;</span>
            <span className="text-white">Devlytics</span>
            <span className="text-cyan-400">/&gt;</span>
          </span>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/70 md:text-[11px]">
          Initializing systems
        </p>
      </motion.div>

      {/* Progress bar */}
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mt-10 w-56 md:w-72"
      >
        <div className="relative h-[2px] overflow-hidden rounded-full bg-white/10">
          <motion.div
            style={{ width: widthPct }}
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-sky-400 shadow-[0_0_14px_rgba(34,211,238,0.7)]"
          />
        </div>
        <div className="mt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/60">
          <span>Loading</span>
          <span>{display.toString().padStart(3, '0')}%</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
