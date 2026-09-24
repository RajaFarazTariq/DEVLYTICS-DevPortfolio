import { Globe, Mail, Palette, Search } from 'lucide-react';
import type { SiteInfo, SiteSettings } from '@/data/settings';
import { SITE_FIELDS } from '@/admin/lib/content';
import { fieldErrors, type Issue } from '@/admin/lib/validate';
import { Badge, Panel, SectionHeader, TextAreaField, TextField } from '@/admin/components/ui';

const field = (key: keyof SiteInfo) => SITE_FIELDS.find((f) => f.key === key)!;

export function SiteSection({
  settings,
  onChange,
  issues,
}: {
  settings: SiteSettings;
  onChange: (settings: SiteSettings) => void;
  issues: Issue[];
}) {
  const errors = fieldErrors(issues);
  const site = settings.site;
  const set = (key: keyof SiteInfo, value: string) => onChange({ ...settings, site: { ...site, [key]: value } });
  const input = (key: keyof SiteInfo, extra: { mono?: boolean; className?: string } = {}) => {
    const f = field(key);
    return (
      <TextField
        label={f.label}
        hint={f.hint}
        value={site[key]}
        onChange={(v) => set(key, v)}
        error={errors[`site.${key}`]}
        max={f.max}
        className={extra.className}
        inputClassName={extra.mono ? 'font-mono' : undefined}
      />
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Site"
        title="Site & SEO"
        description="Your brand name, how the site appears in search results and browser tabs, and where contact form messages go."
        meta={issues.length > 0 ? <Badge tone="danger">{issues.length} to fix</Badge> : undefined}
      />

      <Panel icon={Palette} title="Brand" description="Shown in the navbar, the big hero title, the loading screen and the footer.">
        <div className="rounded-xl border border-white/[0.06] bg-ink-950/50 px-5 py-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl border-2 border-cyan-400/80 font-mono text-sm font-bold text-ink-50">{site.logoLetter}</span>
            <span className="font-mono text-base font-semibold">
              <span className="text-cyan-400">&lt;</span>
              <span className="text-ink-50">
                {site.brandHighlight}
                {site.brandRest}
              </span>
              <span className="text-cyan-400">/&gt;</span>
            </span>
          </div>
          <p className="mt-4 font-display text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-300 to-sky-500 bg-clip-text text-transparent">{site.brandHighlight}</span>
            <span className="text-ink-50">{site.brandRest}</span>
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {input('brandHighlight')}
          {input('brandRest')}
          {input('logoLetter')}
        </div>
      </Panel>

      <Panel icon={Search} title="Search & browser tab" description="Written into the page when the site is built, so search engines pick it up.">
        <div className="rounded-xl border border-white/[0.06] bg-white px-4 py-3.5">
          <p className="flex items-center gap-1.5 text-xs text-[#4d5156]">
            <Globe className="h-3.5 w-3.5" /> devlytics.vercel.app
          </p>
          <p className="mt-1 truncate text-lg text-[#1a0dab]">{site.title || 'Page title'}</p>
          <p className="line-clamp-2 text-sm text-[#4d5156]">{site.description || 'Search description'}</p>
        </div>
        {input('title')}
        <TextAreaField
          label={field('description').label}
          hint={field('description').hint}
          value={site.description}
          onChange={(v) => set('description', v)}
          error={errors['site.description']}
          max={field('description').max}
          rows={3}
        />
      </Panel>

      <Panel icon={Mail} title="Contact form delivery" description="The contact form sends messages through Web3Forms.">
        {input('contactFormKey', { mono: true })}
        {input('contactFormFromName')}
      </Panel>
    </div>
  );
}
