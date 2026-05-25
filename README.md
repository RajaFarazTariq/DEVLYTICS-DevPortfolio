# Devlytics — Portfolio

Premium personal portfolio for **Raja Faraz Tariq** — *Where Development Meets Intelligence*.

Built with **Vite + React + TypeScript + Tailwind + Framer Motion + React Three Fiber**.

---

## ✨ Features

- Modern glass UI with light + dark theme tokens
- Custom cursor with hover / click / text / scroll states
- Fixed top scroll-progress bar
- Animated glass navbar with active-section pill (scroll spy)
- 3D Hero scene (torus knot + orbiting rings + floating icosahedrons + sparkles)
- Ambient 3D background field site-wide
- Auto-rotating cinematic project carousel (click stage to pause)
- Animated skills with progress bars and counters
- Modern timeline for Experience + Education
- Contact form wired to Web3Forms
- Smooth scroll, reduced-motion friendly, fully responsive

---

## 🚀 Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

Production build:

```bash
npm run build
npm run preview
```

---

## 🗂 Architecture

```
src/
├── App.tsx              # Composition root
├── main.tsx             # React entry
├── index.css            # Tailwind layers + design tokens
├── data/                # Profile, projects, skills, experience, nav (pure data)
├── hooks/               # useTheme, useScrollSpy, useMediaQuery
├── utils/               # cn (classnames), motion variants
└── components/
    ├── layout/          # Navbar, Footer, CustomCursor, ScrollProgress
    ├── ui/              # GlassCard, SectionHeading, Reveal, Marquee, etc.
    ├── three/           # HeroScene, AmbientField (React Three Fiber)
    └── sections/        # Hero, About, Skills, Projects, Experience, Contact
```

All content lives in `src/data/*` — edit those files to update the site.

---

## 🎨 Theme

Design tokens are CSS variables driven by a `.dark` class on `<html>`. Tailwind classes use the `rgb(var(--token))` convention, so adding a new accent only takes one line in `src/index.css`.

Gradient brand stack: **#5e8bff → #a78bfa → #ec4899**.

---

## 📷 Project assets

Project preview images live in `public/assets/projects/`. Update the `image` field in `src/data/projects.ts` to swap them out.
