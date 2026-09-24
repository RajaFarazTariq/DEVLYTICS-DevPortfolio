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

Editable content lives in `src/content/*.json` and is loaded by the typed modules in `src/data/*`.
Edit it from the admin panel (below) or by hand:

| File | Holds |
| --- | --- |
| `profile.json` | Name, hero text, rotating roles, contact details, social links, stats, active resume |
| `about.json` | About bio card, discipline cards, Tools & Technologies marquee |
| `projects.json` | Projects carousel (`"hidden": true` = unpublished) |
| `skills.json` | Skill groups and levels |
| `experience.json` | Experience & education timeline (discipline columns with icon + colour) |
| `settings.json` | Section visibility, headings and menu labels; brand name; page title & search description; contact form key; every button/label/message; project categories |

---

## 🔐 Admin panel

A separate page at **`/admin`** for managing all portfolio content without code changes. It never
loads on the public site, and it only changes content — the public design stays as it is.

| Page | What you can do |
| --- | --- |
| Dashboard | Counts (published/hidden projects, skills, experience, education), draft status, site status, recent content commits |
| Profile & Contact | Name, tagline, rotating roles, hero summary, email/phone/location, stats, social links (GitHub, LinkedIn, Instagram, X, YouTube, Facebook, Dribbble, Behance, Medium, website — empty = hidden) |
| About | Bio heading and paragraphs, discipline cards (icon, colour, text), marquee chips |
| Projects | Add, edit, duplicate, delete, drag to reorder, publish/hide, search & filter, upload or reuse images, manage categories (renames carry over to projects) |
| Skills | Groups with icon and colour, skills with levels, reorder |
| Experience & Education | Add, edit, delete, reorder, start/end/current period builder, filter by type, discipline columns with their own icon and colour |
| Sections | Show/hide About, Skills, Projects, Experience, Contact; edit each section's heading and menu label |
| Site & SEO | Brand name and logo letter, page title and search description (written into `index.html` at build time), Web3Forms contact key and sender name |
| Site text | Every button, label, placeholder and message on the site (navigation, loading screen, hero, carousel, contact form, footer) |
| Media | Upload, search, delete unused images (images in use are protected) |
| Resume / CV | Upload PDFs, set the active one, view/download, remove, delete. An active resume adds a "Download CV" button to the hero |

**How it works:** there is no database. You sign in with GitHub, the admin reads
`src/content/*.json` and `public/assets/projects/` from the `main` branch, and publishes all
edits as **one commit**. Vercel redeploys on the push.

**Sign in:** click **Sign in with GitHub**. This uses a GitHub App (installed only on this repo,
with *Contents: Read & write* and *Deployments: Read*) and one serverless function,
`api/auth/[action].ts`, which exchanges the login for a short-lived token. It needs these
Vercel environment variables:

| Variable | Value |
| --- | --- |
| `GITHUB_APP_CLIENT_ID` | GitHub App → Client ID |
| `GITHUB_APP_CLIENT_SECRET` | GitHub App → Generate a new client secret |
| `ADMIN_ALLOWED_LOGINS` | optional, comma-separated (default `RajaFarazTariq`) |

The GitHub App's callback URL must be `https://devlytics.vercel.app/api/auth/callback`.
A [fine-grained token](https://github.com/settings/personal-access-tokens/new) can still be
pasted under *Use an access token instead*.

**Safeguards**

- Only the accounts in `ADMIN_ALLOWED_LOGINS` / `src/admin/config.ts` can sign in. Any other
  account's token is revoked right after its login attempt.
- App tokens expire after 8 hours and renew silently. The renewal token lives in an HttpOnly,
  `SameSite=Strict` cookie scoped to `/api/auth`, so page scripts can't read it. The login uses
  a one-time `state` value, and session endpoints only answer same-origin requests.
- Signing out, or 30 minutes of inactivity, revokes the token and clears the cookies.
- Every edit is validated before it can be applied or published: required fields, unique IDs,
  http(s)-only links, existing images, skill levels 0–100, and no duplicate list entries.
- Publishing refuses to overwrite: if the content files changed on GitHub after loading, or the
  branch moved mid-publish, nothing is written.
- Images still used by a project, and the active resume, can't be deleted. Uploads are checked by
  file signature: images are limited to PNG/JPG/WebP/GIF/AVIF (max 4 MB), resumes to PDF (max 10 MB)
  and stored in `public/assets/resume/`.
- The site can't be left with an empty carousel: at least one project must stay published while the
  Projects section is shown.
- `vercel.json` sends `noindex`, `DENY` framing and a strict CSP for `/admin`.

**Local:** `npm run dev`, then open `http://localhost:5173/admin/`. In dev only, *Local preview*
opens the editor on this checkout's content without signing in (publishing disabled).

---

## 🎨 Theme

Design tokens are CSS variables driven by a `.dark` class on `<html>`. Tailwind classes use the `rgb(var(--token))` convention, so adding a new accent only takes one line in `src/index.css`.

Gradient brand stack: **#5e8bff → #a78bfa → #ec4899**.

---

## 📷 Project assets

Project preview images live in `public/assets/projects/`. Manage them from the admin panel, or change the `image` field in `src/content/projects.json`.
