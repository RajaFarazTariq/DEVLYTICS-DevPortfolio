import settingsContent from '@/content/settings.json';

export type SectionKey = 'about' | 'skills' | 'projects' | 'experience' | 'contact';

export const SECTION_KEYS: SectionKey[] = ['about', 'skills', 'projects', 'experience', 'contact'];

export type SectionSettings = {
  visible: boolean;
  eyebrow: string;
  /** Plain part of the heading. */
  title: string;
  /** Gradient part of the heading, shown after the title. */
  highlight: string;
  subtitle: string;
};

export type SiteSettings = {
  sections: Record<SectionKey, SectionSettings>;
};

// Content lives in src/content/settings.json and is managed from /admin.
export const settings = settingsContent as SiteSettings;

export const sections = settings.sections;

export const isSectionVisible = (id: string) =>
  !(id in sections) || sections[id as SectionKey].visible !== false;
