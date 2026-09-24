import settingsContent from '@/content/settings.json';

export type SectionKey = 'about' | 'skills' | 'projects' | 'experience' | 'contact';

export const SECTION_KEYS: SectionKey[] = ['about', 'skills', 'projects', 'experience', 'contact'];

export type SectionSettings = {
  visible: boolean;
  /** Label of the section's link in the navigation. */
  navLabel: string;
  eyebrow: string;
  /** Plain part of the heading. */
  title: string;
  /** Gradient part of the heading, shown after the title. */
  highlight: string;
  subtitle: string;
};

export type SiteInfo = {
  /** Browser tab / search result title (written into index.html at build time). */
  title: string;
  /** Meta description for search engines (written into index.html at build time). */
  description: string;
  /** Brand name, shown as <highlight><rest> (the highlight part gets the accent colour in the hero). */
  brandHighlight: string;
  brandRest: string;
  /** Letter(s) in the square logo mark. */
  logoLetter: string;
  /** Web3Forms access key the contact form sends messages with. */
  contactFormKey: string;
  /** Sender name on contact form emails. */
  contactFormFromName: string;
};

/** Every piece of interface text on the site (buttons, labels, messages). */
export type SiteText = typeof settingsContent.text;
export type TextKey = keyof SiteText;

export type SiteSettings = {
  sections: Record<SectionKey, SectionSettings>;
  site: SiteInfo;
  text: SiteText;
  projectCategories: string[];
};

// Content lives in src/content/settings.json and is managed from /admin.
export const settings = settingsContent as SiteSettings;

export const sections = settings.sections;
export const site = settings.site;
export const text = settings.text;
export const brandName = `${site.brandHighlight}${site.brandRest}`;

export const isSectionVisible = (id: string) =>
  !(id in sections) || sections[id as SectionKey].visible !== false;

/** Fills {placeholders} in a text, e.g. fillText('© {year}', { year: 2026 }). */
export const fillText = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
