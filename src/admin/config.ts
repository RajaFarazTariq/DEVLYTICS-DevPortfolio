// Admin panel configuration.
// The admin panel has no server of its own: it reads and commits the portfolio
// content files in this GitHub repository, and Vercel redeploys on every push.

export const ADMIN_CONFIG = {
  owner: 'RajaFarazTariq',
  repo: 'DEVLYTICS-DevPortfolio',
  branch: 'main',

  // Only these GitHub accounts may sign in, even if a token for another
  // account has push access to the repository (e.g. a collaborator).
  allowedLogins: ['RajaFarazTariq'],

  // Sign the admin out after this long without activity.
  idleTimeoutMs: 30 * 60 * 1000,

  // Upload guards for project images.
  maxImageBytes: 4 * 1024 * 1024,
  imageDir: 'public/assets/projects',
  imagePublicPrefix: '/assets/projects/',

  // Resume / CV uploads (PDF only).
  maxResumeBytes: 10 * 1024 * 1024,
  resumeDir: 'public/assets/resume',
  resumePublicPrefix: '/assets/resume/',
} as const;

export const CONTENT_FILES = {
  profile: 'src/content/profile.json',
  projects: 'src/content/projects.json',
  skills: 'src/content/skills.json',
  experience: 'src/content/experience.json',
  about: 'src/content/about.json',
  settings: 'src/content/settings.json',
} as const;

export type ContentKey = keyof typeof CONTENT_FILES;

export const CONTENT_KEYS = Object.keys(CONTENT_FILES) as ContentKey[];

export const repoUrl = `https://github.com/${ADMIN_CONFIG.owner}/${ADMIN_CONFIG.repo}`;
