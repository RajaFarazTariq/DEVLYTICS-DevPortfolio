import profileContent from '@/content/profile.json';

export type SocialKey =
  | 'github'
  | 'linkedin'
  | 'instagram'
  | 'x'
  | 'youtube'
  | 'facebook'
  | 'dribbble'
  | 'behance'
  | 'medium'
  | 'website';

export type Profile = {
  brand: string;
  name: string;
  tagline: string;
  role: string;
  roles: string[];
  summary: string;
  location: string;
  email: string;
  phone: string;
  /** Empty links are hidden on the site. `email` is a mailto: link. */
  socials: Partial<Record<SocialKey | 'email', string>>;
  stats: { label: string; value: number; suffix: string }[];
  /** Public path of the active resume/CV (e.g. /assets/resume/cv.pdf). Absent = no resume button. */
  resume?: string;
};

// Content lives in src/content/profile.json and is managed from /admin.
export const profile: Profile = profileContent;
