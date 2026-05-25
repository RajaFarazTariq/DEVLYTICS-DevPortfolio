import { ArrowUp, Github, Instagram, Linkedin, Mail } from 'lucide-react';
import { profile } from '@/data/profile';

export function Footer() {
  return (
    <footer className="relative mt-12 border-t border-[rgb(var(--border))]/70">
      <div className="container-wide py-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-violet-600 font-display text-sm font-bold text-white shadow-glow">
                D
              </span>
              <div className="leading-tight">
                <p className="font-display font-bold">Devlytics</p>
                <p className="text-xs text-muted">{profile.tagline}</p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm text-muted">
              Designed and engineered by {profile.name}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={profile.socials.email}
              aria-label="Email"
              className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border))] transition hover:border-accent-400/60 hover:text-accent-300"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href={profile.socials.github}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border))] transition hover:border-accent-400/60 hover:text-accent-300"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href={profile.socials.linkedin}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border))] transition hover:border-accent-400/60 hover:text-accent-300"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href={profile.socials.instagram}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="grid h-10 w-10 place-items-center rounded-full border border-[rgb(var(--border))] transition hover:border-accent-400/60 hover:text-accent-300"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="divider-line mt-10" />

        <div className="mt-6 flex flex-col items-start justify-between gap-3 text-xs text-muted sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Devlytics · All rights reserved.</p>
          <a
            href="#home"
            className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] px-3 py-1.5 transition hover:border-accent-400/60 hover:text-accent-300"
          >
            Back to top <ArrowUp className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
