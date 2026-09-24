import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { SectionSettings } from '@/data/settings';
import { fadeUp, staggerContainer } from '@/utils/motion';

/** Heading props from a section's settings: "<title> <gradient>highlight</gradient>". */
export function headingProps(s: SectionSettings) {
  const title = s.title.trim();
  const highlight = s.highlight.trim();
  return {
    eyebrow: s.eyebrow,
    subtitle: s.subtitle,
    title: (
      <>
        {title}
        {title && highlight ? ' ' : null}
        {highlight && <span className="text-gradient">{highlight}</span>}
      </>
    ),
  };
}

type Props = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  align?: 'left' | 'center';
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: Props) {
  const isCenter = align === 'center';
  return (
    <motion.header
      variants={staggerContainer()}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      className={isCenter ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}
    >
      <motion.p variants={fadeUp} className="section-eyebrow">
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={fadeUp}
        className="section-title mt-3 font-display"
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p variants={fadeUp} className="section-subtitle">
          {subtitle}
        </motion.p>
      )}
    </motion.header>
  );
}
