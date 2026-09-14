import type { ContentKey } from '@/admin/config';
import type { Profile } from '@/data/profile';
import type { Project } from '@/data/projects';
import type { SkillGroupContent } from '@/data/skills';
import type { ExperienceItem } from '@/data/experience';
import { skillIcons } from '@/data/skillIcons';
import { PILLARS, PROJECT_CATEGORIES, type PortfolioContent } from '@/admin/lib/content';

// Guards that run before anything is committed. They mirror what the public
// components need to render safely (unique React keys, non-empty lists the
// carousel/typewriter index into, valid links, existing images).

export type Issue = {
  section: ContentKey;
  /** Index of the list item the issue belongs to (lists only). */
  index?: number;
  /** Field path inside the item, e.g. "links.github" or "items.2.level". */
  field: string;
  /** Human-readable location, e.g. "Projects › SmartHire AI". */
  where: string;
  message: string;
};

export type ValidationContext = {
  /** Returns false when a managed /assets/projects/ image is missing from the repo. */
  imageExists: (publicPath: string) => boolean;
};

export const LIMITS = {
  short: 120,
  summary: 220,
  long: 2000,
  listItem: 300,
  tag: 60,
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return (u.protocol === 'https:' || u.protocol === 'http:') && !!u.hostname;
  } catch {
    return false;
  }
}

function isCssColor(value: string) {
  return typeof CSS !== 'undefined' && CSS.supports('background-color', value);
}

class Collector {
  issues: Issue[] = [];
  constructor(
    private section: ContentKey,
    private where: string,
    private index?: number,
  ) {}

  add(field: string, message: string) {
    this.issues.push({ section: this.section, index: this.index, field, where: this.where, message });
  }

  required(field: string, value: string | undefined, label: string, max = LIMITS.short) {
    const v = (value ?? '').trim();
    if (!v) this.add(field, `${label} is required.`);
    else if (v.length > max) this.add(field, `${label} must be at most ${max} characters (now ${v.length}).`);
  }

  optional(field: string, value: string | undefined, label: string, max = LIMITS.short) {
    const v = (value ?? '').trim();
    if (v.length > max) this.add(field, `${label} must be at most ${max} characters (now ${v.length}).`);
  }

  url(field: string, value: string | undefined, label: string, required = false) {
    const v = (value ?? '').trim();
    if (!v) {
      if (required) this.add(field, `${label} is required.`);
      return;
    }
    if (!isHttpUrl(v)) this.add(field, `${label} must be a full http(s) URL, e.g. https://example.com.`);
  }

  /** Lists rendered with the value as React key must not contain duplicates. */
  tags(field: string, values: string[] | undefined, label: string, { min = 0 } = {}) {
    const list = (values ?? []).map((v) => v.trim()).filter(Boolean);
    if (list.length < min) this.add(field, `Add at least ${min} ${label.toLowerCase()}.`);
    const seen = new Set<string>();
    for (const v of list) {
      if (v.length > LIMITS.tag) this.add(field, `"${v.slice(0, 20)}…" is too long (max ${LIMITS.tag}).`);
      if (seen.has(v)) this.add(field, `"${v}" is listed twice in ${label.toLowerCase()}.`);
      seen.add(v);
    }
  }

  lines(field: string, values: string[] | undefined, label: string) {
    for (const v of values ?? []) {
      if (v.trim().length > LIMITS.listItem) {
        this.add(field, `A ${label.toLowerCase()} entry is longer than ${LIMITS.listItem} characters.`);
      }
    }
  }
}

function checkIds(section: ContentKey, items: { id: string }[], label: (i: number) => string) {
  const issues: Issue[] = [];
  const seen = new Map<string, number>();
  items.forEach((item, index) => {
    const id = (item.id ?? '').trim();
    const where = label(index);
    if (!id) issues.push({ section, index, field: 'id', where, message: 'ID is required.' });
    else if (!SLUG.test(id)) {
      issues.push({ section, index, field: 'id', where, message: 'ID may only use lowercase letters, numbers and single dashes.' });
    } else if (seen.has(id)) {
      issues.push({ section, index, field: 'id', where, message: `ID "${id}" is already used by another entry.` });
    }
    seen.set(id, index);
  });
  return issues;
}

export function validateProfile(p: Profile): Issue[] {
  const c = new Collector('profile', 'Profile');
  c.required('name', p.name, 'Name');
  c.required('tagline', p.tagline, 'Tagline');
  c.required('summary', p.summary, 'Hero summary', LIMITS.long);
  c.required('location', p.location, 'Location');
  c.required('phone', p.phone, 'Phone', 40);

  const roles = p.roles.map((r) => r.trim()).filter(Boolean);
  if (roles.length === 0) c.add('roles', 'Add at least one rotating role — the hero typewriter needs one.');
  c.tags('roles', p.roles, 'Roles');

  if (!EMAIL.test(p.email.trim())) c.add('email', 'Email address is not valid.');
  c.url('socials.github', p.socials.github, 'GitHub URL', true);
  c.url('socials.linkedin', p.socials.linkedin, 'LinkedIn URL', true);
  c.url('socials.instagram', p.socials.instagram, 'Instagram URL', true);
  const mail = p.socials.email.trim();
  if (!/^mailto:/i.test(mail) || !EMAIL.test(mail.replace(/^mailto:/i, ''))) {
    c.add('socials.email', 'Email link must look like mailto:you@example.com.');
  }

  const labels = new Set<string>();
  p.stats.forEach((s, i) => {
    c.required(`stats.${i}.label`, s.label, `Stat ${i + 1} label`, 40);
    if (labels.has(s.label.trim())) c.add(`stats.${i}.label`, `Stat label "${s.label}" is used twice.`);
    labels.add(s.label.trim());
    if (!Number.isInteger(Number(s.value)) || Number(s.value) < 0 || Number(s.value) > 1_000_000) {
      c.add(`stats.${i}.value`, `Stat ${i + 1} value must be a whole number between 0 and 1,000,000.`);
    }
    c.optional(`stats.${i}.suffix`, s.suffix, `Stat ${i + 1} suffix`, 4);
  });
  return c.issues;
}

export function validateProject(p: Project, index: number, ctx: ValidationContext): Issue[] {
  const c = new Collector('projects', `Projects › ${p.title.trim() || `#${index + 1}`}`, index);
  c.required('title', p.title, 'Title');
  c.optional('subtitle', p.subtitle, 'Subtitle');
  c.required('summary', p.summary, 'Summary', LIMITS.summary);
  c.required('description', p.description, 'Description', LIMITS.long);
  if (!PROJECT_CATEGORIES.includes(p.category)) c.add('category', 'Choose a category.');
  c.tags('tech', p.tech, 'Technologies', { min: 1 });

  const image = p.image.trim();
  if (!image) c.add('image', 'A project image is required.');
  else if (image.startsWith('/')) {
    if (!ctx.imageExists(image)) c.add('image', `Image ${image} does not exist in the repository.`);
  } else if (!isHttpUrl(image)) {
    c.add('image', 'Image must be an uploaded file or a full https:// URL.');
  }
  if (p.imageBg?.trim() && !isCssColor(p.imageBg.trim())) {
    c.add('imageBg', 'Image background must be a CSS colour, e.g. #0b0f1e.');
  }
  c.url('links.github', p.links.github, 'GitHub link');
  c.url('links.demo', p.links.demo, 'Live demo link');
  return c.issues;
}

export function validateSkillGroup(g: SkillGroupContent, index: number): Issue[] {
  const c = new Collector('skills', `Skills › ${g.title.trim() || `#${index + 1}`}`, index);
  c.required('title', g.title, 'Group title', 60);
  if (!(g.icon in skillIcons)) c.add('icon', 'Choose an icon.');
  if (!/^text-[a-z]+-\d{2,3}$/.test(g.accent.trim())) c.add('accent', 'Choose an icon colour.');
  if (g.items.length === 0) c.add('items', 'Add at least one skill.');
  const names = new Set<string>();
  g.items.forEach((item, i) => {
    const name = item.name.trim();
    if (!name) c.add(`items.${i}.name`, `Skill ${i + 1} needs a name.`);
    else if (name.length > LIMITS.tag) c.add(`items.${i}.name`, `Skill "${name.slice(0, 20)}…" is too long.`);
    if (name && names.has(name)) c.add(`items.${i}.name`, `Skill "${name}" is listed twice.`);
    names.add(name);
    const lvl = Number(item.level);
    if (!Number.isInteger(lvl) || lvl < 0 || lvl > 100) {
      c.add(`items.${i}.level`, `Level for "${name || `skill ${i + 1}`}" must be a whole number from 0 to 100.`);
    }
  });
  return c.issues;
}

export function validateExperience(e: ExperienceItem, index: number): Issue[] {
  const kind = e.type === 'education' ? 'Education' : 'Experience';
  const c = new Collector('experience', `${kind} › ${e.role.trim() || `#${index + 1}`}`, index);
  if (e.type !== 'work' && e.type !== 'education') c.add('type', 'Choose work or education.');
  c.required('role', e.role, e.type === 'education' ? 'Degree / programme' : 'Role');
  c.required('company', e.company, e.type === 'education' ? 'Institution' : 'Company');
  c.required('period', e.period, 'Period', 60);
  c.optional('location', e.location, 'Location');
  c.optional('summary', e.summary, 'Summary', LIMITS.long);
  c.lines('bullets', e.bullets, 'Highlights');
  c.tags('stack', e.stack, 'Stack');

  const keys = new Set<string>();
  (e.pillars ?? []).forEach((p, i) => {
    if (!PILLARS.some((x) => x.key === p.key)) c.add(`pillars.${i}.key`, 'Choose a discipline.');
    if (keys.has(p.key)) c.add(`pillars.${i}.key`, `Discipline "${p.key}" is used twice.`);
    keys.add(p.key);
    c.required(`pillars.${i}.name`, p.name, `Discipline ${i + 1} title`, 60);
    c.required(`pillars.${i}.description`, p.description, `Discipline ${i + 1} description`, LIMITS.summary);
    c.lines(`pillars.${i}.bullets`, p.bullets, 'Highlights');
    c.tags(`pillars.${i}.stack`, p.stack, 'Stack');
  });
  return c.issues;
}

export function validateSection(
  key: ContentKey,
  content: PortfolioContent,
  ctx: ValidationContext,
): Issue[] {
  switch (key) {
    case 'profile':
      return validateProfile(content.profile);
    case 'projects': {
      const issues = checkIds('projects', content.projects, (i) => `Projects › ${content.projects[i].title || `#${i + 1}`}`);
      if (content.projects.length === 0) {
        issues.push({ section: 'projects', field: '', where: 'Projects', message: 'Keep at least one project — the carousel cannot render an empty list.' });
      }
      content.projects.forEach((p, i) => issues.push(...validateProject(p, i, ctx)));
      return issues;
    }
    case 'skills': {
      const issues = checkIds('skills', content.skills, (i) => `Skills › ${content.skills[i].title || `#${i + 1}`}`);
      content.skills.forEach((g, i) => issues.push(...validateSkillGroup(g, i)));
      return issues;
    }
    case 'experience': {
      const issues = checkIds('experience', content.experience, (i) => `Experience › ${content.experience[i].role || `#${i + 1}`}`);
      content.experience.forEach((e, i) => issues.push(...validateExperience(e, i)));
      return issues;
    }
  }
}

/** ID checks for a single item being edited against the other items in its list. */
export function idIssues(
  section: ContentKey,
  id: string,
  otherIds: string[],
  index: number,
  where: string,
): Issue[] {
  const v = id.trim();
  const issue = (message: string): Issue[] => [{ section, index, field: 'id', where, message }];
  if (!v) return issue('ID is required.');
  if (!SLUG.test(v)) return issue('ID may only use lowercase letters, numbers and single dashes.');
  if (otherIds.includes(v)) return issue(`ID "${v}" is already used by another entry.`);
  return [];
}

/** Map of field path -> first message, for inline form errors. */
export function fieldErrors(issues: Issue[]) {
  const map: Record<string, string> = {};
  for (const issue of issues) if (!(issue.field in map)) map[issue.field] = issue.message;
  return map;
}
