import type { ComponentType } from 'react';
import { Dribbble, Facebook, Github, Globe, Instagram, Linkedin, Mail, Youtube } from 'lucide-react';
import { SiBehance, SiMedium, SiX } from 'react-icons/si';
import { profile, type SocialKey } from '@/data/profile';

type IconType = ComponentType<{ className?: string }>;

export const SOCIAL_PLATFORMS: { key: SocialKey; label: string; icon: IconType; placeholder: string }[] = [
  { key: 'github', label: 'GitHub', icon: Github, placeholder: 'https://github.com/…' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/…' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/…' },
  { key: 'x', label: 'X (Twitter)', icon: SiX, placeholder: 'https://x.com/…' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@…' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/…' },
  { key: 'dribbble', label: 'Dribbble', icon: Dribbble, placeholder: 'https://dribbble.com/…' },
  { key: 'behance', label: 'Behance', icon: SiBehance, placeholder: 'https://behance.net/…' },
  { key: 'medium', label: 'Medium', icon: SiMedium, placeholder: 'https://medium.com/@…' },
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://…' },
];

export type SocialLink = { key: SocialKey | 'email'; label: string; href: string; icon: IconType; external: boolean };

const emailLink = (): SocialLink[] => {
  const href = profile.socials.email?.trim();
  return href ? [{ key: 'email', label: 'Email', href, icon: Mail, external: false }] : [];
};

/** Social icons with a link set, in a fixed order. Empty links are left out. */
export function socialLinks({ emailFirst }: { emailFirst: boolean }): SocialLink[] {
  const web = SOCIAL_PLATFORMS.flatMap(({ key, label, icon }) => {
    const href = profile.socials[key]?.trim();
    return href ? [{ key, label, href, icon, external: true }] : [];
  });
  return emailFirst ? [...emailLink(), ...web] : [...web, ...emailLink()];
}
