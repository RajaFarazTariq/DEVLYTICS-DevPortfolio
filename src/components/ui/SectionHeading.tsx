import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUp, staggerContainer } from '@/utils/motion';

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
