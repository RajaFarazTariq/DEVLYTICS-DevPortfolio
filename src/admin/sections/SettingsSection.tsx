import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { SECTION_KEYS, type SectionKey, type SectionSettings, type SiteSettings } from '@/data/settings';
import { SECTION_LABELS } from '@/admin/lib/content';
import { LIMITS, fieldErrors, type Issue } from '@/admin/lib/validate';
import { Badge, SectionHeader, TextField, Toggle } from '@/admin/components/ui';
import { cn } from '@/utils/cn';

const HIDE_EFFECTS: Record<SectionKey, string> = {
  about: 'Its navigation link is removed.',
  skills: 'Its navigation link is removed.',
  projects: 'Its navigation link and the hero "View Projects" button are removed.',
  experience: 'Its navigation link is removed.',
  contact: 'Its navigation link, the navbar "Contact" button and the hero "Contact Me" button are removed.',
};

export function SettingsSection({
  settings,
  onChange,
  issues,
  publishedProjects,
}: {
  settings: SiteSettings;
  onChange: (settings: SiteSettings) => void;
  issues: Issue[];
  publishedProjects: number;
}) {
  const errors = fieldErrors(issues);
  const setSection = (key: SectionKey, patch: Partial<SectionSettings>) =>
    onChange({ ...settings, sections: { ...settings.sections, [key]: { ...settings.sections[key], ...patch } } });
  const visibleCount = SECTION_KEYS.filter((k) => settings.sections[k].visible).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Site"
        title="Sections"
        description="Show or hide each part of the page and edit its heading. Hiding a section only removes it from the page — its content stays saved here, and the design is unchanged."
        meta={<Badge tone={visibleCount === SECTION_KEYS.length ? 'success' : 'warn'}>{visibleCount} of {SECTION_KEYS.length} visible</Badge>}
      />

      <p className="text-xs text-ink-400">The hero at the top of the page is always shown. Headings appear as “eyebrow”, then the title with the highlighted word in the gradient colour.</p>

      {SECTION_KEYS.map((key) => {
        const s = settings.sections[key];
        return (
          <section key={key} className={cn('adm-section', !s.visible && 'opacity-80')}>
            <div className="adm-section-head">
              <div className="flex items-start gap-3">
                <span className={cn('adm-icon-chip', s.visible ? 'text-emerald-300' : 'text-ink-500')}>
                  {s.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </span>
                <div>
                  <h2 className="adm-section-title">{SECTION_LABELS[key]}</h2>
                  <p className="adm-section-desc">{s.visible ? 'Shown on the site.' : `Hidden. ${HIDE_EFFECTS[key]}`}</p>
                </div>
              </div>
              <Toggle checked={s.visible} onChange={(visible) => setSection(key, { visible })} label={s.visible ? 'Visible' : 'Hidden'} />
            </div>
            <div className="adm-section-body">
              {key === 'projects' && s.visible && publishedProjects === 0 && (
                <p className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  No project is published. Publish one on the Projects page or hide this section.
                </p>
              )}

              {/* Preview in the site's heading style */}
              <div className="rounded-xl border border-white/[0.06] bg-ink-950/50 px-4 py-5 text-center">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-accent-300">{s.eyebrow || '—'}</p>
                <p className="mt-2 font-display text-2xl font-bold text-ink-50">
                  {s.title}
                  {s.title && s.highlight ? ' ' : ''}
                  <span className="bg-gradient-to-r from-accent-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">{s.highlight}</span>
                </p>
                {s.subtitle && <p className="mx-auto mt-2 max-w-xl text-sm text-ink-400">{s.subtitle}</p>}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <TextField label="Eyebrow" value={s.eyebrow} onChange={(eyebrow) => setSection(key, { eyebrow })} error={errors[`${key}.eyebrow`]} placeholder="01 — Introduction" />
                <TextField label="Title" value={s.title} onChange={(title) => setSection(key, { title })} error={errors[`${key}.title`]} />
                <TextField label="Highlighted word" value={s.highlight} onChange={(highlight) => setSection(key, { highlight })} error={errors[`${key}.highlight`]} />
              </div>
              <TextField
                label="Subtitle (optional)"
                value={s.subtitle}
                onChange={(subtitle) => setSection(key, { subtitle })}
                error={errors[`${key}.subtitle`]}
                max={LIMITS.summary}
              />
            </div>
          </section>
        );
      })}
    </div>
  );
}
