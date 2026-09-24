import { BarChart3, Link2, Mail, Plus, Sparkles } from 'lucide-react';
import type { Profile } from '@/data/profile';
import { SOCIAL_PLATFORMS } from '@/data/socials';
import { LIMITS, fieldErrors, type Issue } from '@/admin/lib/validate';
import { Badge, Panel, ReorderButtons, SectionHeader, TagInput, TextAreaField, TextField, moveItem } from '@/admin/components/ui';

const STAT_COLUMNS = 'sm:grid-cols-[minmax(0,1fr)_120px_96px_112px]';

export function ProfileSection({
  profile,
  onChange,
  issues,
}: {
  profile: Profile;
  onChange: (profile: Profile) => void;
  issues: Issue[];
}) {
  const errors = fieldErrors(issues);
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => onChange({ ...profile, [key]: value });
  const setSocial = (key: keyof Profile['socials'], value: string) =>
    onChange({ ...profile, socials: { ...profile.socials, [key]: value } });
  const setStat = (i: number, patch: Partial<Profile['stats'][number]>) =>
    set('stats', profile.stats.map((s, k) => (k === i ? { ...s, ...patch } : s)));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Content"
        title="Profile"
        description="Your name, hero text, contact details, social links and headline stats. The About bio lives on the About page, the CV on Resume / CV."
        meta={issues.length > 0 ? <Badge tone="danger">{issues.length} to fix</Badge> : undefined}
      />

      <Panel icon={Sparkles} title="Hero" description="The first thing visitors see.">
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="Full name" value={profile.name} onChange={(v) => set('name', v)} error={errors.name} max={LIMITS.short} hint="Shown in the footer." />
          <TextField label="Tagline" value={profile.tagline} onChange={(v) => set('tagline', v)} error={errors.tagline} max={LIMITS.short} hint="The chip above the Devlytics title." />
        </div>
        <TagInput
          label="Rotating roles"
          values={profile.roles}
          onChange={(v) => set('roles', v)}
          error={errors.roles}
          hint="Typed out one after another in the hero. Press Enter to add."
        />
        <TextAreaField label="Hero summary" value={profile.summary} onChange={(v) => set('summary', v)} error={errors.summary} max={LIMITS.long} rows={4} />
      </Panel>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel icon={Mail} title="Contact" description="Listed in the contact section. Leave phone or location empty to hide it.">
          <TextField label="Email" type="email" value={profile.email} onChange={(v) => set('email', v)} error={errors.email} />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="Phone (optional)" value={profile.phone} onChange={(v) => set('phone', v)} error={errors.phone} />
            <TextField label="Location (optional)" value={profile.location} onChange={(v) => set('location', v)} error={errors.location} />
          </div>
        </Panel>

        <Panel icon={Link2} title="Social links" description="Icons in the hero, footer and contact section. Leave a link empty to hide its icon.">
          <div className="grid gap-5 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
              <TextField
                key={key}
                label={label}
                type="url"
                value={profile.socials[key] ?? ''}
                onChange={(v) => setSocial(key, v)}
                error={errors[`socials.${key}`]}
                placeholder={placeholder}
              />
            ))}
            <div>
              <TextField label="Email link" value={profile.socials.email ?? ''} onChange={(v) => setSocial('email', v)} error={errors['socials.email']} placeholder="mailto:you@example.com" />
              {profile.socials.email !== `mailto:${profile.email.trim()}` && profile.email.trim() && (
                <button type="button" className="mt-1.5 text-xs text-accent-300 hover:underline" onClick={() => setSocial('email', `mailto:${profile.email.trim()}`)}>
                  Use mailto:{profile.email.trim()}
                </button>
              )}
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        icon={BarChart3}
        title="Stats"
        description="Animated counters in the About section. The layout is designed for three."
        flush
        aside={
          <button type="button" className="adm-btn-secondary adm-btn-sm" onClick={() => set('stats', [...profile.stats, { label: '', value: 0, suffix: '' }])}>
            <Plus className="h-3.5 w-3.5" /> Add stat
          </button>
        }
      >
        <div className={`adm-table-head sm:grid sm:gap-3 ${STAT_COLUMNS}`}>
          <span>Label</span>
          <span>Value</span>
          <span>Suffix</span>
          <span className="text-right">Order</span>
        </div>
        {profile.stats.length === 0 && <p className="px-6 py-8 text-center text-sm text-ink-400">No stats yet.</p>}
        {profile.stats.map((s, i) => (
          <div key={i} className={`adm-table-row grid items-start gap-3 ${STAT_COLUMNS}`}>
            <TextField label="Label" labelClassName="sm:sr-only" value={s.label} onChange={(v) => setStat(i, { label: v })} error={errors[`stats.${i}.label`]} />
            <TextField
              label="Value"
              labelClassName="sm:sr-only"
              type="number"
              min={0}
              step={1}
              value={String(s.value)}
              onChange={(v) => setStat(i, { value: v === '' ? 0 : Number(v) })}
              error={errors[`stats.${i}.value`]}
            />
            <TextField label="Suffix" labelClassName="sm:sr-only" value={s.suffix} onChange={(v) => setStat(i, { suffix: v })} error={errors[`stats.${i}.suffix`]} placeholder="+" />
            <div className="flex justify-end sm:pt-1">
              <ReorderButtons
                index={i}
                length={profile.stats.length}
                label={`stat ${s.label || i + 1}`}
                onMove={(from, to) => set('stats', moveItem(profile.stats, from, to))}
                onDelete={() => set('stats', profile.stats.filter((_, k) => k !== i))}
              />
            </div>
          </div>
        ))}
      </Panel>
    </div>
  );
}
