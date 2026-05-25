import { useEffect, useRef, useState } from 'react';

export function useScrollSpy(ids: string[], offset = 120) {
  const [active, setActive] = useState<string>(ids[0] ?? '');
  // Stable key for the deps array — avoids effect re-runs when caller passes a
  // freshly-mapped (but identical) array on every render.
  const key = ids.join('|');
  const lastRef = useRef<string>(active);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    const onScroll = () => {
      const y = window.scrollY + offset;
      let current = ids[0] ?? '';
      for (const el of sections) {
        if (el.offsetTop <= y) current = el.id;
      }
      if (current !== lastRef.current) {
        lastRef.current = current;
        setActive(current);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, offset]);

  return active;
}
