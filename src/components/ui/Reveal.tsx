import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUp } from '@/utils/motion';

type Props = {
  children: ReactNode;
  delay?: number;
  variants?: Variants;
  className?: string;
  amount?: number;
};

export function Reveal({
  children,
  delay = 0,
  variants = fadeUp,
  className,
  amount = 0.3,
}: Props) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
