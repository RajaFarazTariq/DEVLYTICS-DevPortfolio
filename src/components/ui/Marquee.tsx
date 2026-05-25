import type { ComponentType, SVGProps } from 'react';
import {
  SiCss,
  SiDjango,
  SiDocker,
  SiFigma,
  SiFramer,
  SiGit,
  SiGithub,
  SiHtml5,
  SiJavascript,
  SiMysql,
  SiNestjs,
  SiNodedotjs,
  SiNumpy,
  SiOpencv,
  SiPandas,
  SiPostgresql,
  SiPostman,
  SiPython,
  SiReact,
  SiSocketdotio,
  SiTailwindcss,
  SiThreedotjs,
  SiTypescript,
  SiVite,
} from 'react-icons/si';
import { BarChart3, BrainCircuit, Code2, ScanEye } from 'lucide-react';

type IconType = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type TechItem = {
  name: string;
  Icon: IconType;
  color: string;
};

// Theme palette
const C = {
  cyan: '#22d3ee',
  sky: '#38bdf8',
  blue: '#5e8bff',
  violet: '#a78bfa',
  pink: '#ec4899',
  amber: '#fbbf24',
  green: '#34d399',
};

const tools: TechItem[] = [
  { name: 'Git', Icon: SiGit, color: C.pink },
  { name: 'GitHub', Icon: SiGithub, color: C.violet },
  { name: 'VS Code', Icon: Code2, color: C.blue },
  { name: 'Docker', Icon: SiDocker, color: C.cyan },
  { name: 'Vite', Icon: SiVite, color: C.amber },
  { name: 'PostgreSQL', Icon: SiPostgresql, color: C.blue },
  { name: 'MySQL', Icon: SiMysql, color: C.cyan },
  { name: 'Pandas', Icon: SiPandas, color: C.violet },
  { name: 'NumPy', Icon: SiNumpy, color: C.sky },
  { name: 'OpenCV', Icon: SiOpencv, color: C.pink },
  { name: 'Figma', Icon: SiFigma, color: C.green },
  { name: 'Postman', Icon: SiPostman, color: C.amber },
  { name: 'Zoho Analytics', Icon: BarChart3, color: C.green },
];

const technologies: TechItem[] = [
  { name: 'React.js', Icon: SiReact, color: C.cyan },
  { name: 'TypeScript', Icon: SiTypescript, color: C.blue },
  { name: 'JavaScript', Icon: SiJavascript, color: C.amber },
  { name: 'Python', Icon: SiPython, color: C.sky },
  { name: 'Node.js', Icon: SiNodedotjs, color: C.green },
  { name: 'Django', Icon: SiDjango, color: C.violet },
  { name: 'NestJS', Icon: SiNestjs, color: C.pink },
  { name: 'Tailwind CSS', Icon: SiTailwindcss, color: C.sky },
  { name: 'Three.js', Icon: SiThreedotjs, color: C.violet },
  { name: 'Framer Motion', Icon: SiFramer, color: C.pink },
  { name: 'Socket.io', Icon: SiSocketdotio, color: C.cyan },
  { name: 'HTML5', Icon: SiHtml5, color: C.amber },
  { name: 'CSS3', Icon: SiCss, color: C.blue },
  { name: 'YOLOv9', Icon: ScanEye, color: C.amber },
  { name: 'LLM APIs', Icon: BrainCircuit, color: C.violet },
];

function MarqueeRow({
  items,
  reverse = false,
  duration = '38s',
}: {
  items: TechItem[];
  reverse?: boolean;
  duration?: string;
}) {
  const doubled = [...items, ...items];
  return (
    <div className="mask-fade-x relative overflow-hidden py-2.5">
      <div
        className={`marquee-track ${reverse ? 'marquee-track--reverse' : ''}`}
        style={{ ['--marquee-duration' as string]: duration }}
      >
        {doubled.map(({ name, Icon, color }, i) => (
          <span
            key={`${name}-${i}`}
            className="inline-flex items-center gap-2.5 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--surface))]/85 px-4 py-2 text-sm font-medium text-soft shadow-[0_1px_2px_rgb(15_23_42/0.04)] dark:bg-[rgb(var(--surface))]/40 dark:shadow-none"
          >
            <Icon
              className="h-4 w-4 shrink-0"
              style={{ color }}
              aria-hidden
            />
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Marquee() {
  return (
    <div className="flex flex-col gap-3">
      <MarqueeRow items={tools} reverse duration="42s" />
      <MarqueeRow items={technologies} duration="48s" />
    </div>
  );
}
