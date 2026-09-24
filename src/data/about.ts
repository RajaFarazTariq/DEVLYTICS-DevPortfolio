import aboutContent from '@/content/about.json';
import type { SkillIconName } from '@/data/skillIcons';
import type { TechColor } from '@/data/techIcons';

// Colour presets for the About discipline cards (icon tile gradient + icon colour).
export const pillarTones = {
  blue: { accent: 'from-accent-500/30 to-violet-500/30', iconColor: 'text-accent-300' },
  violet: { accent: 'from-violet-500/30 to-pink-500/30', iconColor: 'text-violet-300' },
  pink: { accent: 'from-pink-500/30 to-amber-500/30', iconColor: 'text-pink-300' },
  amber: { accent: 'from-amber-500/30 to-pink-500/30', iconColor: 'text-amber-300' },
  emerald: { accent: 'from-emerald-500/30 to-cyan-500/30', iconColor: 'text-emerald-300' },
  cyan: { accent: 'from-cyan-500/30 to-accent-500/30', iconColor: 'text-cyan-300' },
} as const;

export type PillarTone = keyof typeof pillarTones;

export type AboutPillar = {
  icon: SkillIconName;
  title: string;
  description: string;
  tone: PillarTone;
};

export type MarqueeItem = {
  name: string;
  /** Key in src/data/techIcons.ts */
  icon: string;
  color: TechColor;
};

export type About = {
  heading: string;
  paragraphs: string[];
  pillars: AboutPillar[];
  marqueeLabel: string;
  tools: MarqueeItem[];
  technologies: MarqueeItem[];
};

// Content lives in src/content/about.json and is managed from /admin.
export const about = aboutContent as About;
