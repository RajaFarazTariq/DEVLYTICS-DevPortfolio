import experienceContent from '@/content/experience.json';
import type { SkillIconName } from '@/data/skillIcons';

/** Unique id of a discipline column inside an entry (e.g. "web"). */
export type PillarKey = string;

export const pillarStyles = {
  cyan: { text: 'text-cyan-300', bullet: 'bg-cyan-400', tint: 'from-cyan-500/12 via-transparent to-transparent', border: 'border-cyan-400/20' },
  violet: { text: 'text-violet-300', bullet: 'bg-violet-400', tint: 'from-violet-500/12 via-transparent to-transparent', border: 'border-violet-400/20' },
  pink: { text: 'text-pink-300', bullet: 'bg-pink-400', tint: 'from-pink-500/12 via-transparent to-transparent', border: 'border-pink-400/20' },
  emerald: { text: 'text-emerald-300', bullet: 'bg-emerald-400', tint: 'from-emerald-500/12 via-transparent to-transparent', border: 'border-emerald-400/20' },
  amber: { text: 'text-amber-300', bullet: 'bg-amber-400', tint: 'from-amber-500/12 via-transparent to-transparent', border: 'border-amber-400/20' },
  sky: { text: 'text-sky-300', bullet: 'bg-sky-400', tint: 'from-sky-500/12 via-transparent to-transparent', border: 'border-sky-400/20' },
} as const;

export type PillarStyle = keyof typeof pillarStyles;

/** Icon and colour for the original web / data / ai columns, which don't store them. */
export const PILLAR_DEFAULTS: Record<string, { icon: SkillIconName; style: PillarStyle }> = {
  web: { icon: 'Code2', style: 'cyan' },
  data: { icon: 'BarChart3', style: 'violet' },
  ai: { icon: 'BrainCircuit', style: 'pink' },
};

export type Pillar = {
  key: PillarKey;
  name: string;
  description: string;
  bullets: string[];
  stack: string[];
  icon?: SkillIconName;
  style?: PillarStyle;
};

export const pillarIcon = (p: Pillar): SkillIconName => p.icon ?? PILLAR_DEFAULTS[p.key]?.icon ?? 'Code2';
export const pillarStyle = (p: Pillar): PillarStyle => p.style ?? PILLAR_DEFAULTS[p.key]?.style ?? 'cyan';

export type ExperienceItem = {
  id: string;
  type: 'work' | 'education';
  role: string;
  company: string;
  period: string;
  location?: string;
  summary?: string;
  pillars?: Pillar[];
  bullets?: string[];
  stack?: string[];
};

// Content lives in src/content/experience.json and is managed from /admin.
export const experience = experienceContent as ExperienceItem[];
