import { Plus } from 'lucide-react';
import type { Profile } from '@/data/profile';
import { LIMITS, fieldErrors, type Issue } from '@/admin/lib/validate';
import { ReorderButtons, SectionHeader, TagInput, TextAreaField, TextField, moveItem } from '@/admin/components/ui';

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
      <SectionHeader title="Profile" description="Your name, hero text, contact details, social links and headline stats." />

      <section className="adm-card space-y-5 p-6">
        <h2 className="font-display text-base font-semibold text-ink-50">Hero</h2>
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
      </section>

      <section className="adm-card space-y-5 p-6">
        <h2 className="font-display text-base font-semibold text-ink-50">Contact</h2>
        <div className="grid gap-5 md:grid-cols-3">
          <TextField label="Email" type="email" value={profile.email} onChange={(v) => set('email', v)} error={errors.email} />
          <TextField label="Phone" value={profile.phone} onChange={(v) => set('phone', v)} error={errors.phone} />
          <TextField label="Location" value={profile.location} onChange={(v) => set('location', v)} error={errors.location} />
        </div>
      </section>

      <section className="adm-card space-y-5 p-6">
        <h2 className="font-display text-base font-semibold text-ink-50">Social links</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <TextField label="GitHub" type="url" value={profile.socials.github} onChange={(v) => setSocial('github', v)} error={errors['socials.github']} placeholder="https://github.com/…" />
          <TextField label="LinkedIn" type="url" value={profile.socials.linkedin} onChange={(v) => setSocial('linkedin', v)} error={errors['socials.linkedin']} placeholder="https://linkedin.com/in/…" />
          <TextField label="Instagram" type="url" value={profile.socials.instagram} onChange={(v) => setSocial('instagram', v)} error={errors['socials.instagram']} placeholder="https://instagram.com/…" />
          <div>
            <TextField label="Email link" value={profile.socials.email} onChange={(v) => setSocial('email', v)} error={errors['socials.email']} placeholder="mailto:you@example.com" />
            {profile.socials.email !== `mailto:${profile.email.trim()}` && profile.email.trim() && (
              <button type="button" className="mt-1.5 text-xs text-accent-300 hover:underline" onClick={() => setSocial('email', `mailto:${profile.email.trim()}`)}>
                Use mailto:{profile.email.trim()}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="adm-card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-ink-50">Stats</h2>
            <p className="text-xs text-ink-500">Animated counters in the About section. The layout is designed for three.</p>
          </div>
          <button type="button" className="adm-btn-secondary text-xs" onClick={() => set('stats', [...profile.stats, { label: '', value: 0, suffix: '' }])}>
            <Plus className="h-3.5 w-3.5" /> Add stat
          </button>
        </div>
        {profile.stats.map((s, i) => (
          <div key={i} className="grid items-start gap-3 rounded-xl border border-white/[0.06] p-3 sm:grid-cols-[1fr_120px_90px_auto]">
            <TextField label="Label" value={s.label} onChange={(v) => setStat(i, { label: v })} error={errors[`stats.${i}.label`]} />
            <TextField
              label="Value"
              type="number"
              min={0}
              step={1}
              value={String(s.value)}
              onChange={(v) => setStat(i, { value: v === '' ? 0 : Number(v) })}
              error={errors[`stats.${i}.value`]}
            />
            <TextField label="Suffix" value={s.suffix} onChange={(v) => setStat(i, { suffix: v })} error={errors[`stats.${i}.suffix`]} placeholder="+" />
            <div className="pt-6">
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
      </section>
    </div>
  );
}
