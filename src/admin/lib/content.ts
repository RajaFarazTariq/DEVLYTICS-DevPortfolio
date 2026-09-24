import type { Profile } from '@/data/profile';
import type { Project } from '@/data/projects';
import type { SkillGroupContent } from '@/data/skills';
import { pillarStyles, type ExperienceItem, type Pillar, type PillarStyle } from '@/data/experience';
import type { About, AboutPillar, MarqueeItem, PillarTone } from '@/data/about';
import { SECTION_KEYS, type SectionSettings, type SiteInfo, type SiteSettings, type TextKey } from '@/data/settings';
import { SOCIAL_PLATFORMS } from '@/data/socials';
import type { ContentKey } from '@/admin/config';

export type PortfolioContent = {
  profile: Profile;
  projects: Project[];
  skills: SkillGroupContent[];
  experience: ExperienceItem[];
  about: About;
  settings: SiteSettings;
};

/** Content files holding one object (the rest hold a list). */
const OBJECT_KEYS: ContentKey[] = ['profile', 'about', 'settings'];

export const PILLAR_TONES: { value: PillarTone; label: string }[] = [
  { value: 'blue', label: 'Blue → violet' },
  { value: 'violet', label: 'Violet → pink' },
  { value: 'pink', label: 'Pink → amber' },
  { value: 'amber', label: 'Amber → pink' },
  { value: 'emerald', label: 'Emerald → cyan' },
  { value: 'cyan', label: 'Cyan → blue' },
];

export const SECTION_LABELS: Record<keyof SiteSettings['sections'], string> = {
  about: 'About',
  skills: 'Skills',
  projects: 'Projects',
  experience: 'Experience & Education',
  contact: 'Contact',
};

export const PILLAR_STYLE_OPTIONS: { value: PillarStyle; label: string }[] = (Object.keys(pillarStyles) as PillarStyle[]).map(
  (value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }),
);

export const SITE_FIELDS: { key: keyof SiteInfo; label: string; hint?: string; max: number }[] = [
  { key: 'title', label: 'Page title', hint: 'Browser tab and search result title.', max: 70 },
  { key: 'description', label: 'Search description', hint: 'Shown under the title in Google results. Aim for 120–160 characters.', max: 300 },
  { key: 'brandHighlight', label: 'Brand — coloured part', hint: 'e.g. “Dev” (gradient in the hero title).', max: 30 },
  { key: 'brandRest', label: 'Brand — rest', hint: 'e.g. “lytics”.', max: 30 },
  { key: 'logoLetter', label: 'Logo letter', hint: 'Inside the square logo mark (1–2 characters).', max: 2 },
  { key: 'contactFormKey', label: 'Web3Forms access key', hint: 'Contact form messages are delivered to the email registered with this key at web3forms.com.', max: 60 },
  { key: 'contactFormFromName', label: 'Contact email sender name', hint: 'Shown as the sender of contact form emails you receive.', max: 60 },
];

/** Every interface text on the site, grouped by where it appears. {placeholders} are filled in automatically. */
export const TEXT_FIELDS: { key: TextKey; label: string; group: string; hint?: string; max: number }[] = [
  { key: 'navHome', label: 'Home link', group: 'Navigation', max: 30, hint: 'Other link labels are set per section on the Sections page.' },
  { key: 'navContactButton', label: 'Navbar contact button', group: 'Navigation', max: 30 },
  { key: 'loadingTagline', label: 'Tagline under the logo', group: 'Loading screen', max: 60 },
  { key: 'loadingLabel', label: 'Progress label', group: 'Loading screen', max: 30 },
  { key: 'heroProjectsButton', label: 'Projects button', group: 'Hero', max: 30 },
  { key: 'heroContactButton', label: 'Contact button', group: 'Hero', max: 30 },
  { key: 'heroResumeButton', label: 'Resume button', group: 'Hero', max: 30, hint: 'Only shown while a resume is active.' },
  { key: 'heroScrollHint', label: 'Scroll hint', group: 'Hero', max: 30 },
  { key: 'heroSceneLoading', label: '3D scene loading text', group: 'Hero', max: 60 },
  { key: 'projectsCodeButton', label: 'Code link button', group: 'Projects carousel', max: 30 },
  { key: 'projectsDemoButton', label: 'Live demo button', group: 'Projects carousel', max: 30 },
  { key: 'projectsAutoRotating', label: 'Status: rotating', group: 'Projects carousel', max: 30 },
  { key: 'projectsPaused', label: 'Status: paused', group: 'Projects carousel', max: 30 },
  { key: 'projectsPlay', label: 'Play button', group: 'Projects carousel', max: 30 },
  { key: 'projectsPause', label: 'Pause button', group: 'Projects carousel', max: 30 },
  { key: 'contactEmailLabel', label: 'Email label', group: 'Contact details', max: 30 },
  { key: 'contactLocationLabel', label: 'Location label', group: 'Contact details', max: 30 },
  { key: 'contactPhoneLabel', label: 'Phone label', group: 'Contact details', max: 30 },
  { key: 'formNameLabel', label: 'Name label', group: 'Contact form', max: 40 },
  { key: 'formNamePlaceholder', label: 'Name placeholder', group: 'Contact form', max: 60 },
  { key: 'formEmailLabel', label: 'Email label', group: 'Contact form', max: 40 },
  { key: 'formEmailPlaceholder', label: 'Email placeholder', group: 'Contact form', max: 60 },
  { key: 'formSubjectLabel', label: 'Subject label', group: 'Contact form', max: 40 },
  { key: 'formSubjectPlaceholder', label: 'Subject placeholder', group: 'Contact form', max: 60 },
  { key: 'formMessageLabel', label: 'Message label', group: 'Contact form', max: 40 },
  { key: 'formMessagePlaceholder', label: 'Message placeholder', group: 'Contact form', max: 80 },
  { key: 'formSubmit', label: 'Send button', group: 'Contact form', max: 30 },
  { key: 'formSending', label: 'Sending state', group: 'Contact form', max: 30 },
  { key: 'formSuccess', label: 'Success message', group: 'Contact form', max: 160 },
  { key: 'formError', label: 'Error message', group: 'Contact form', max: 200, hint: '{email} is replaced with your email address.' },
  { key: 'footerCredit', label: 'Credit line', group: 'Footer', max: 120, hint: '{name} is replaced with your name.' },
  { key: 'footerCopyright', label: 'Copyright line', group: 'Footer', max: 120, hint: '{year} is replaced with the current year.' },
  { key: 'footerBackToTop', label: 'Back to top button', group: 'Footer', max: 30 },
];

// Gradient presets already used by the site (projects keep this field even
// though the current layout does not render it).
export const PROJECT_ACCENTS = [
  'from-accent-500 to-pink-500',
  'from-accent-500 to-violet-600',
  'from-cyan-500 to-violet-600',
  'from-violet-600 to-pink-500',
  'from-sky-500 to-violet-700',
  'from-cyan-600 to-violet-600',
  'from-violet-700 to-accent-600',
];

// Icon colours for skill groups. Kept to classes that exist in the site's CSS.
export const SKILL_ACCENTS = [
  'text-accent-400',
  'text-violet-400',
  'text-emerald-400',
  'text-amber-400',
  'text-pink-400',
  'text-sky-400',
];

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

const strList = (v: unknown) =>
  Array.isArray(v) ? v.map(str).filter(Boolean) : [];

/** Sets `key` only when the value is non-empty, so optional fields stay absent. */
function optional<T extends object, K extends string, V>(
  obj: T,
  key: K,
  value: V,
): T & Partial<Record<K, V>> {
  const empty =
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0);
  if (!empty) (obj as Record<string, unknown>)[key] = value;
  return obj;
}

// ── Normalisers ──────────────────────────────────────────────────────────────
// Produce canonical objects (trimmed strings, empty optionals removed, stable
// key order) so an untouched file serialises byte-for-byte as it was loaded.

export function normalizeProfile(p: Profile): Profile {
  const out = { ...p } as Profile;
  out.name = str(p.name);
  out.tagline = str(p.tagline);
  out.roles = strList(p.roles);
  out.summary = str(p.summary);
  out.location = str(p.location);
  out.email = str(p.email);
  out.phone = str(p.phone);
  // The original four links are always present (empty = hidden); other platforms only when set.
  const socials: Profile['socials'] = {
    github: str(p.socials.github),
    linkedin: str(p.socials.linkedin),
    instagram: str(p.socials.instagram),
    email: str(p.socials.email),
  };
  for (const { key } of SOCIAL_PLATFORMS) optional(socials, key, str(p.socials[key]));
  out.socials = socials;
  out.stats = p.stats.map((s) => ({
    label: str(s.label),
    value: Number(s.value),
    suffix: str(s.suffix),
  }));
  delete out.resume;
  optional(out, 'resume', str(p.resume));
  return out;
}

export function normalizeProject(p: Project): Project {
  const out: Record<string, unknown> = {};
  out.id = str(p.id);
  out.title = str(p.title);
  optional(out, 'subtitle', str(p.subtitle));
  out.category = p.category;
  out.summary = str(p.summary);
  out.description = str(p.description);
  out.tech = strList(p.tech);
  out.image = str(p.image);
  optional(out, 'imageBg', str(p.imageBg));
  out.accent = str(p.accent) || PROJECT_ACCENTS[0];
  const links: Project['links'] = {};
  optional(links, 'github', str(p.links?.github));
  optional(links, 'demo', str(p.links?.demo));
  out.links = links;
  if (p.hidden) out.hidden = true;
  return out as Project;
}

export function normalizeSkillGroup(g: SkillGroupContent): SkillGroupContent {
  return {
    id: str(g.id),
    title: str(g.title),
    icon: g.icon,
    accent: str(g.accent),
    items: g.items.map((i) => ({ name: str(i.name), level: Number(i.level) })),
  };
}

function normalizePillar(p: Pillar): Pillar {
  const out: Pillar = {
    key: str(p.key),
    name: str(p.name),
    description: str(p.description),
    bullets: strList(p.bullets),
    stack: strList(p.stack),
  };
  // Only stored when chosen; the original web/data/ai columns fall back to their defaults.
  optional(out, 'icon', p.icon);
  optional(out, 'style', p.style);
  return out;
}

export function normalizeExperience(e: ExperienceItem): ExperienceItem {
  const out: Record<string, unknown> = {};
  out.id = str(e.id);
  out.type = e.type;
  out.role = str(e.role);
  out.company = str(e.company);
  out.period = str(e.period);
  optional(out, 'location', str(e.location));
  optional(out, 'summary', str(e.summary));
  optional(out, 'pillars', (e.pillars ?? []).map(normalizePillar));
  optional(out, 'bullets', strList(e.bullets));
  optional(out, 'stack', strList(e.stack));
  return out as ExperienceItem;
}

function normalizeMarqueeItem(m: MarqueeItem): MarqueeItem {
  return { name: str(m.name), icon: str(m.icon), color: m.color };
}

function normalizeAboutPillar(p: AboutPillar): AboutPillar {
  return { icon: p.icon, title: str(p.title), description: str(p.description), tone: p.tone };
}

export function normalizeAbout(a: About): About {
  return {
    heading: str(a.heading),
    paragraphs: strList(a.paragraphs),
    pillars: a.pillars.map(normalizeAboutPillar),
    marqueeLabel: str(a.marqueeLabel),
    tools: a.tools.map(normalizeMarqueeItem),
    technologies: a.technologies.map(normalizeMarqueeItem),
  };
}

function normalizeSectionSettings(s: SectionSettings): SectionSettings {
  return {
    visible: s.visible !== false,
    navLabel: str(s.navLabel),
    eyebrow: str(s.eyebrow),
    title: str(s.title),
    highlight: str(s.highlight),
    subtitle: str(s.subtitle),
  };
}

export function normalizeSettings(s: SiteSettings): SiteSettings {
  const sections = {} as SiteSettings['sections'];
  for (const key of SECTION_KEYS) sections[key] = normalizeSectionSettings(s.sections[key]);
  const site = {} as SiteInfo;
  for (const { key } of SITE_FIELDS) site[key] = str(s.site?.[key]);
  const text = {} as SiteSettings['text'];
  for (const { key } of TEXT_FIELDS) text[key] = str(s.text?.[key]);
  return { ...s, sections, site, text, projectCategories: strList(s.projectCategories) };
}

export function normalizeSection<K extends ContentKey>(
  key: K,
  value: PortfolioContent[K],
): PortfolioContent[K] {
  switch (key) {
    case 'profile':
      return normalizeProfile(value as Profile) as PortfolioContent[K];
    case 'projects':
      return (value as Project[]).map(normalizeProject) as PortfolioContent[K];
    case 'skills':
      return (value as SkillGroupContent[]).map(normalizeSkillGroup) as PortfolioContent[K];
    case 'experience':
      return (value as ExperienceItem[]).map(normalizeExperience) as PortfolioContent[K];
    case 'about':
      return normalizeAbout(value as About) as PortfolioContent[K];
    case 'settings':
      return normalizeSettings(value as SiteSettings) as PortfolioContent[K];
    default:
      return value;
  }
}

export function serializeSection<K extends ContentKey>(key: K, value: PortfolioContent[K]) {
  return JSON.stringify(normalizeSection(key, value), null, 2) + '\n';
}

// ── Shape checks for files loaded from GitHub ────────────────────────────────

export function parseSection(key: ContentKey, text: string): unknown {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${key}.json on GitHub is not valid JSON. Fix it in the repository before editing.`);
  }
  const isList = !OBJECT_KEYS.includes(key);
  if (isList ? !Array.isArray(data) : typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`${key}.json on GitHub has an unexpected shape (expected ${isList ? 'a list' : 'an object'}).`);
  }
  const obj = data as Record<string, unknown>;
  if (key === 'settings') {
    const sections = obj.sections as Record<string, unknown> | undefined;
    if (!sections || SECTION_KEYS.some((k) => typeof sections[k] !== 'object' || sections[k] === null)) {
      throw new Error(`settings.json on GitHub is missing a section (expected ${SECTION_KEYS.join(', ')}).`);
    }
  }
  if (key === 'about' && ['paragraphs', 'pillars', 'tools', 'technologies'].some((k) => !Array.isArray(obj[k]))) {
    throw new Error('about.json on GitHub has an unexpected shape (paragraphs, pillars, tools and technologies must be lists).');
  }
  return data;
}

export function uniqueSlug(base: string, taken: Iterable<string>) {
  const used = new Set(taken);
  const root = base || 'item';
  if (!used.has(root)) return root;
  let n = 2;
  while (used.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

export function emptyProject(id: string, category = ''): Project {
  return {
    id,
    title: '',
    category,
    summary: '',
    description: '',
    tech: [],
    image: '',
    accent: PROJECT_ACCENTS[0],
    links: {},
  };
}

/** Copy of a project for "Duplicate": new unique id, unpublished until reviewed. */
export function duplicateProject(p: Project, takenIds: string[]): Project {
  return {
    ...structuredClone(p),
    id: uniqueSlug(`${p.id}-copy`, takenIds),
    title: `${p.title} (copy)`,
    hidden: true,
  };
}

export function emptySkillGroup(id: string): SkillGroupContent {
  return { id, title: '', icon: 'Code2', accent: SKILL_ACCENTS[0], items: [] };
}

export function emptyExperience(id: string, type: ExperienceItem['type']): ExperienceItem {
  return { id, type, role: '', company: '', period: '' };
}
