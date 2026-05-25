import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CustomCursor } from '@/components/layout/CustomCursor';
import { ScrollProgress } from '@/components/layout/ScrollProgress';
import { LoadingScreen } from '@/components/layout/LoadingScreen';
import { Hero } from '@/components/sections/Hero';
import { About } from '@/components/sections/About';
import { Skills } from '@/components/sections/Skills';
import { Projects } from '@/components/sections/Projects';
import { Experience } from '@/components/sections/Experience';
import { Contact } from '@/components/sections/Contact';
import { BackToTop } from '@/components/ui/BackToTop';

const MIN_SPLASH_MS = 3000;

export default function App() {
  const [loading, setLoading] = useState(true);

  // Always start at the top on a fresh load, unless the URL has an anchor
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

  // Show splash until both: minimum delay has passed AND window load has fired.
  // Also prefetch the lazy HeroScene chunk so it's hot by the time we fade out.
  useEffect(() => {
    const minDelay = new Promise<void>((resolve) =>
      window.setTimeout(resolve, MIN_SPLASH_MS),
    );
    const windowReady =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            const onLoad = () => resolve();
            window.addEventListener('load', onLoad, { once: true });
          });

    // Warm the Hero 3D chunk in parallel with the splash
    import('@/components/three/HeroScene').catch(() => undefined);

    Promise.all([minDelay, windowReady]).then(() => setLoading(false));
  }, []);

  // Lock body scroll while the splash is shown
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = loading ? 'hidden' : prev || '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [loading]);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <LoadingScreen key="loading-screen" />}
      </AnimatePresence>

      <div className="relative min-h-screen" aria-hidden={loading}>
        <div className="pointer-events-none fixed inset-0 -z-30 bg-page-glow" />

        <ScrollProgress />
        <CustomCursor />
        <Navbar />

        <main className="relative">
          <Hero />
          <About />
          <Skills />
          <Projects />
          <Experience />
          <Contact />
        </main>

        <Footer />
        <BackToTop />
      </div>
    </>
  );
}
