import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Moon, Send, Sun, X } from 'lucide-react';
import { navLinks } from '@/data/nav';
import { useTheme } from '@/hooks/useTheme';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { cn } from '@/utils/cn';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const activeId = useScrollSpy(navLinks.map((n) => n.id));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled ? 'py-2' : 'py-4',
      )}
    >
      <div className="container-wide">
        <div
          className={cn(
            'flex items-center justify-between rounded-2xl px-4 py-3 transition-all duration-500 md:px-6',
            scrolled
              ? 'glass-strong shadow-soft'
              : 'border border-transparent bg-transparent',
          )}
        >
          <a href="#home" className="group flex items-center gap-3">
            <span className="relative grid h-9 w-9 place-items-center rounded-xl border-2 border-cyan-400/80 bg-transparent font-mono text-sm font-bold text-[rgb(var(--fg))] shadow-[0_0_18px_-2px_rgba(34,211,238,0.35)] transition group-hover:border-cyan-300 group-hover:shadow-[0_0_24px_-2px_rgba(34,211,238,0.55)]">
              D
            </span>
            <span className="font-mono text-sm font-semibold tracking-tight md:text-base">
              <span className="text-cyan-400">&lt;</span>
              <span className="text-[rgb(var(--fg))]">Devlytics</span>
              <span className="text-cyan-400">/&gt;</span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const active = activeId === link.id;
              return (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'text-[rgb(var(--fg))]'
                      : 'text-soft hover:text-[rgb(var(--fg))]',
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-[rgb(var(--surface-2))] ring-1 ring-[rgb(var(--border))] dark:bg-[rgb(var(--surface))]/80"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  {link.label}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="grid h-9 w-9 place-items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/60 transition hover:border-accent-400/60"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.span
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Sun className="h-4 w-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Moon className="h-4 w-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <a
              href="#contact"
              className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 px-4 py-2 text-sm font-semibold text-[#021a26] shadow-[0_8px_24px_-8px_rgba(34,211,238,0.55)] transition hover:brightness-110 sm:inline-flex"
            >
              <Send className="h-3.5 w-3.5" />
              Contact
            </a>

            <button
              onClick={() => setOpen((o) => !o)}
              className="grid h-9 w-9 place-items-center rounded-full border border-[rgb(var(--border))] md:hidden"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="glass mt-2 overflow-hidden rounded-2xl p-2 md:hidden"
            >
              <ul className="flex flex-col">
                {navLinks.map((link) => (
                  <li key={link.id}>
                    <a
                      href={`#${link.id}`}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'block rounded-xl px-4 py-3.5 text-[15px] font-medium transition active:scale-[0.98]',
                        activeId === link.id
                          ? 'bg-[rgb(var(--surface-2))] text-[rgb(var(--fg))] dark:bg-[rgb(var(--surface))]/80'
                          : 'text-soft hover:bg-[rgb(var(--surface))]/40',
                      )}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
