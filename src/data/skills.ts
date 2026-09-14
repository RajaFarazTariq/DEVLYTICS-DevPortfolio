import { Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import skillsContent from '@/content/skills.json';
import { skillIcons, type SkillIconName } from '@/data/skillIcons';

export type SkillItem = { name: string; level: number };

/** Shape stored in src/content/skills.json (icon referenced by name). */
export type SkillGroupContent = {
  id: string;
  title: string;
  icon: SkillIconName;
  accent: string; // tailwind text-* color class
  items: SkillItem[];
};

export type SkillGroup = Omit<SkillGroupContent, 'icon'> & { icon: LucideIcon };

// Content lives in src/content/skills.json and is managed from /admin.
export const skillGroups: SkillGroup[] = (skillsContent as SkillGroupContent[]).map(
  (group) => ({ ...group, icon: skillIcons[group.icon] ?? Wrench }),
);
