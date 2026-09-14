import profileContent from '@/content/profile.json';

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
  socials: {
    github: string;
    linkedin: string;
    instagram: string;
    email: string;
  };
  stats: { label: string; value: number; suffix: string }[];
};

// Content lives in src/content/profile.json and is managed from /admin.
export const profile: Profile = profileContent;
