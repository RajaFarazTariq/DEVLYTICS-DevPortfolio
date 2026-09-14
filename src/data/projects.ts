import projectsContent from '@/content/projects.json';

export type ProjectCategory = 'Web Development' | 'Data Analytics' | 'AI / ML';

export type Project = {
  id: string;
  title: string;
  subtitle?: string;
  category: ProjectCategory;
  summary: string;
  description: string;
  tech: string[];
  image: string;
  imageBg?: string; // optional CSS background for the image container (use when the asset is designed for a specific backdrop)
  accent: string; // tailwind gradient utility class
  links: {
    github?: string;
    demo?: string;
  };
};

// Content lives in src/content/projects.json and is managed from /admin.
export const projects = projectsContent as Project[];
