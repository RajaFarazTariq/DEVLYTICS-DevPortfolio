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

Editable content (profile, projects, skills, experience & education) lives in `src/content/*.json`
and is loaded by the typed modules in `src/data/*`. Edit it from the admin panel (below) or by hand.

---

## 🔐 Admin panel

A separate page at **`/admin`** for adding, editing, reordering and deleting portfolio content
and project images — no code changes needed. It never loads on the public site.

**How it works:** there is no server or database. The admin signs in with a GitHub token, reads
`src/content/*.json` and `public/assets/projects/` from the `main` branch, and publishes all
edits as **one commit**. Vercel redeploys on the push.

**Sign in:** create a [fine-grained token](https://github.com/settings/personal-access-tokens/new)
with *Only select repositories → DEVLYTICS-DevPortfolio*, **Contents: Read and write**, and
optionally **Deployments: Read-only** (shows deploy status). Paste it on `/admin`.

**Safeguards**

- Only the GitHub accounts in `src/admin/config.ts` (`allowedLogins`) can sign in.
- The token is kept in `sessionStorage` only, sent only to `api.github.com`, and cleared after
  30 minutes of inactivity or when the tab closes.
- Every edit is validated before it can be applied or published: required fields, unique IDs,
  http(s)-only links, existing images, skill levels 0–100, and no duplicate list entries.
- Publishing refuses to overwrite: if the content files changed on GitHub after loading, or the
  branch moved mid-publish, nothing is written.
- Images still used by a project can't be deleted. Uploads are checked by file signature,
  limited to PNG/JPG/WebP/GIF/AVIF, and capped at 4 MB.
- `vercel.json` sends `noindex`, `DENY` framing and a strict CSP for `/admin`.

**Local:** `npm run dev`, then open `http://localhost:5173/admin/`. In dev only, *Local preview*
opens the editor on this checkout's content without signing in (publishing disabled).

---

## 🎨 Theme

Design tokens are CSS variables driven by a `.dark` class on `<html>`. Tailwind classes use the `rgb(var(--token))` convention, so adding a new accent only takes one line in `src/index.css`.

Gradient brand stack: **#5e8bff → #a78bfa → #ec4899**.

---

## 📷 Project assets

Project preview images live in `public/assets/projects/`. Update the `image` field in `src/data/projects.ts` to swap them out.
