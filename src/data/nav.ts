import { isSectionVisible } from '@/data/settings';

export type NavLink = { id: string; label: string };

const allNavLinks: NavLink[] = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
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
