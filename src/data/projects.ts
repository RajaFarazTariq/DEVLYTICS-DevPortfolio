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
  /** Unpublished: kept in the content file but not shown on the site. */
  hidden?: boolean;
};

// Content lives in src/content/projects.json and is managed from /admin.
export const allProjects = projectsContent as Project[];

/** Published projects, in carousel order. */
export const projects = allProjects.filter((p) => !p.hidden);
