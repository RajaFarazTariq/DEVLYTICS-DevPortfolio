import {
  BarChart3,
  Bot,
  Brain,
  BrainCircuit,
  Cloud,
  Code2,
  Cpu,
  Database,
  GitBranch,
  Globe,
  Layers,
  LineChart,
  Palette,
  Server,
  Shield,
  Smartphone,
  Terminal,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Icons a skill group or About card can use. Content files reference them by name.
export const skillIcons = {
  Code2,
  Server,
  Database,
  BarChart3,
  Brain,
  BrainCircuit,
  Wrench,
  Bot,
  Cloud,
  Cpu,
  GitBranch,
  Globe,
  Layers,
  LineChart,
  Palette,
  Shield,
  Smartphone,
  Terminal,
} satisfies Record<string, LucideIcon>;

export type SkillIconName = keyof typeof skillIcons;
