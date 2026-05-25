import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  hoverable?: boolean;
  padded?: boolean;
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, hoverable = true, padded = true, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'glass relative overflow-hidden rounded-2xl',
          padded && 'p-6',
          hoverable &&
            'transition-all duration-500 hover:-translate-y-1 hover:shadow-glow',
          className,
        )}
        {...rest}
      >
        <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        {children}
      </div>
    );
  },
);
GlassCard.displayName = 'GlassCard';
