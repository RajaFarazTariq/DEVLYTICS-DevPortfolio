import {
  Code2,
  Server,
  Database,
  BarChart3,
  Brain,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SkillItem = { name: string; level: number };
export type SkillGroup = {
  id: string;
  title: string;
  icon: LucideIcon;
  accent: string; // tailwind text-* color class
  items: SkillItem[];
};

export const skillGroups: SkillGroup[] = [
  {
    id: 'frontend',
    title: 'Frontend',
    icon: Code2,
    accent: 'text-accent-400',
    items: [
      { name: 'React.js', level: 92 },
      { name: 'TypeScript / JavaScript', level: 90 },
      { name: 'Tailwind CSS / CSS3', level: 90 },
      { name: 'Framer Motion', level: 85 },
      { name: 'React Konva / Zustand', level: 82 },
      { name: 'Responsive / Mobile UI', level: 88 },
    ],
  },
  {
    id: 'backend',
    title: 'Backend',
    icon: Server,
    accent: 'text-violet-400',
    items: [
      { name: 'Python / Django', level: 92 },
      { name: 'Node.js / NestJS', level: 85 },
      { name: 'REST APIs / FastAPI', level: 88 },
      { name: 'WebSockets / Socket.io', level: 88 },
      { name: 'Authentication / RBAC', level: 85 },
      { name: 'Postman / API Testing', level: 82 },
    ],
  },
  {
    id: 'databases',
    title: 'Databases',
    icon: Database,
    accent: 'text-emerald-400',
    items: [
      { name: 'PostgreSQL', level: 88 },
      { name: 'MySQL', level: 85 },
      { name: 'SQL Query Optimization', level: 82 },
      { name: 'Schema Design', level: 85 },
      { name: 'Indexing & Joins', level: 80 },
    ],
  },
  {
    id: 'data',
    title: 'Data Analytics',
    icon: BarChart3,
    accent: 'text-amber-400',
    items: [
      { name: 'Pandas / NumPy', level: 90 },
      { name: 'Zoho Analytics', level: 88 },
      { name: 'ETL Pipelines', level: 86 },
      { name: 'Dashboarding / BI', level: 85 },
      { name: 'Excel · Power Query', level: 80 },
    ],
  },
  {
    id: 'ai',
    title: 'AI / ML',
    icon: Brain,
    accent: 'text-pink-400',
    items: [
      { name: 'OpenCV', level: 88 },
      { name: 'YOLOv9 / Object Detection', level: 86 },
      { name: 'Mediapipe / DeepFace', level: 82 },
      { name: 'LLM APIs (Groq, LLaMA, Gemini)', level: 80 },
      { name: 'scikit-learn / TensorFlow', level: 76 },
    ],
  },
  {
    id: 'tools',
    title: 'Tools & Platforms',
    icon: Wrench,
    accent: 'text-sky-400',
    items: [
      { name: 'Git / GitHub', level: 90 },
      { name: 'Docker', level: 78 },
      { name: 'Linux / Bash', level: 80 },
      { name: 'Postman', level: 85 },
      { name: 'CI/CD basics', level: 75 },
    ],
  },
];
