import type { ComponentType, SVGProps } from 'react';
import { Wrench } from 'lucide-react';
import { about, type MarqueeItem } from '@/data/about';
import { techColors, techIcons } from '@/data/techIcons';

type IconType = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

type TechItem = {
  name: string;
  Icon: IconType;
  color: string;
};

// Items come from src/content/about.json (managed from /admin).
const toTechItem = (item: MarqueeItem): TechItem => ({
  name: item.name,
  Icon: techIcons[item.icon]?.Icon ?? Wrench,
  color: techColors[item.color] ?? techColors.blue,
});

const tools: TechItem[] = about.tools.map(toTechItem);

const technologies: TechItem[] = about.technologies.map(toTechItem);

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
