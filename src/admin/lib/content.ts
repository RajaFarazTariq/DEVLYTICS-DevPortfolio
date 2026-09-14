import type { Profile } from '@/data/profile';
import type { Project, ProjectCategory } from '@/data/projects';
import type { SkillGroupContent } from '@/data/skills';
import type { ExperienceItem, Pillar, PillarKey } from '@/data/experience';
import type { ContentKey } from '@/admin/config';

export type PortfolioContent = {
  profile: Profile;
  projects: Project[];
  skills: SkillGroupContent[];
  experience: ExperienceItem[];
};

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  'Web Development',
  'Data Analytics',
  'AI / ML',
];

export const PILLARS: { key: PillarKey; label: string }[] = [
  { key: 'web', label: 'Web Development' },
  { key: 'data', label: 'Data Analytics' },
  { key: 'ai', label: 'AI / Machine Learning' },
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
  out.socials = {
    ...p.socials,
    github: str(p.socials.github),
    linkedin: str(p.socials.linkedin),
    instagram: str(p.socials.instagram),
    email: str(p.socials.email),
  };
  out.stats = p.stats.map((s) => ({
    label: str(s.label),
    value: Number(s.value),
    suffix: str(s.suffix),
  }));
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
  return {
    key: p.key,
    name: str(p.name),
    description: str(p.description),
    bullets: strList(p.bullets),
    stack: strList(p.stack),
  };
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
  const isList = key !== 'profile';
  if (isList ? !Array.isArray(data) : typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error(`${key}.json on GitHub has an unexpected shape (expected ${isList ? 'a list' : 'an object'}).`);
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

export function emptyProject(id: string): Project {
  return {
    id,
    title: '',
    category: PROJECT_CATEGORIES[0],
    summary: '',
    description: '',
    tech: [],
    image: '',
    accent: PROJECT_ACCENTS[0],
    links: {},
  };
}

export function emptySkillGroup(id: string): SkillGroupContent {
  return { id, title: '', icon: 'Code2', accent: SKILL_ACCENTS[0], items: [] };
}

export function emptyExperience(id: string, type: ExperienceItem['type']): ExperienceItem {
  return { id, type, role: '', company: '', period: '' };
}
