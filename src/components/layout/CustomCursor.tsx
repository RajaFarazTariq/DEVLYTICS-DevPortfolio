import { useEffect, useRef, useState } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const HOVER_SELECTOR = 'a, button, [data-cursor="hover"], input, textarea, label';
const TEXT_SELECTOR = 'input, textarea, [data-cursor="text"]';

type Mode = 'idle' | 'hover' | 'text' | 'click' | 'scroll';

export function CustomCursor() {
  const isFine = useMediaQuery('(pointer: fine)');
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: -50, y: -50 });
  const pos = useRef({ x: -50, y: -50 });
  const raf = useRef<number>();
  const lastModeRef = useRef<Mode>('idle');
  const [mode, setMode] = useState<Mode>('idle');

  // Avoid React state churn when the mode hasn't actually changed.
  const updateMode = useRef((m: Mode) => {
    if (lastModeRef.current === m) return;
    lastModeRef.current = m;
    setMode(m);
  });

  useEffect(() => {
    if (!isFine) return;

    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    };

    // Re-evaluate hover/text mode only when the pointer enters a new element,
    // not on every pixel of movement.
    let lastOverEl: Element | null = null;
    const onOver = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (!el || el === lastOverEl) return;
      lastOverEl = el;
      if (el.closest(TEXT_SELECTOR)) updateMode.current('text');
      else if (el.closest(HOVER_SELECTOR)) updateMode.current('hover');
      else updateMode.current('idle');
    };

    const onDown = () => updateMode.current('click');
    const onUp = () =>
      updateMode.current(lastModeRef.current === 'click' ? 'idle' : lastModeRef.current);

    let scrollTimer: number | undefined;
    const onScroll = () => {
      updateMode.current('scroll');
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => updateMode.current('idle'), 350);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    const tick = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.18;
      pos.current.y += (target.current.y - pos.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${target.current.x}px, ${target.current.y}px, 0) translate(-50%, -50%)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('scroll', onScroll);
      if (raf.current) cancelAnimationFrame(raf.current);
      window.clearTimeout(scrollTimer);
    };
  }, [isFine]);

  if (!isFine) return null;

  return (
    <div
      className={`cursor-root ${mode !== 'idle' ? `cursor--${mode}` : ''}`}
      aria-hidden
    >
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot" />
    </div>
  );
}
