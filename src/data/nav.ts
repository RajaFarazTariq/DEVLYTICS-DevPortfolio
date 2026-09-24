import { isSectionVisible, sections, text, type SectionKey } from '@/data/settings';

export type NavLink = { id: string; label: string };

const SECTION_ORDER: SectionKey[] = ['about', 'skills', 'projects', 'experience', 'contact'];

// Labels are managed from /admin (Site text + Sections).
const allNavLinks: NavLink[] = [
  { id: 'home', label: text.navHome },
  ...SECTION_ORDER.map((id) => ({ id, label: sections[id].navLabel })),
];

// Sections switched off in /admin are left out of the navigation.
export const navLinks = allNavLinks.filter((l) => isSectionVisible(l.id));

export const marqueeTech = [
  'React.js',
  'TypeScript',
  'Tailwind CSS',
  'Framer Motion',
  'Three.js',
  'Python',
  'Django',
  'Node.js',
  'NestJS',
  'PostgreSQL',
  'MySQL',
  'Pandas',
  'NumPy',
  'OpenCV',
  'YOLOv9',
  'Zoho Analytics',
  'Socket.io',
  'LLM APIs',
];
