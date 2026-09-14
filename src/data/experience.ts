import experienceContent from '@/content/experience.json';

export type PillarKey = 'web' | 'data' | 'ai';

export type Pillar = {
  key: PillarKey;
  name: string;
  description: string;
  bullets: string[];
  stack: string[];
};

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
