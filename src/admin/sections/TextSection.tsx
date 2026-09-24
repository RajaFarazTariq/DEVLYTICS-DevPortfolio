import { useState } from 'react';
import { SearchX, Type } from 'lucide-react';
import type { SiteSettings, TextKey } from '@/data/settings';
import { TEXT_FIELDS } from '@/admin/lib/content';
import { fieldErrors, type Issue } from '@/admin/lib/validate';
import { Badge, EmptyState, Panel, SearchInput, SectionHeader, TextField } from '@/admin/components/ui';

const GROUPS = [...new Set(TEXT_FIELDS.map((f) => f.group))];

export function TextSection({
  settings,
  onChange,
  issues,
}: {
  settings: SiteSettings;
  onChange: (settings: SiteSettings) => void;
  issues: Issue[];
}) {
  const errors = fieldErrors(issues);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const set = (key: TextKey, value: string) => onChange({ ...settings, text: { ...settings.text, [key]: value } });
  const matches = (f: (typeof TEXT_FIELDS)[number]) =>
    !q || [f.label, f.group, settings.text[f.key]].some((t) => t.toLowerCase().includes(q));
  const shownGroups = GROUPS.filter((g) => TEXT_FIELDS.some((f) => f.group === g && matches(f)));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Site"
        title="Site text"
        description="Every button, label and message on the site. Section headings and menu labels are on the Sections page."
        meta={issues.length > 0 ? <Badge tone="danger">{issues.length} to fix</Badge> : <Badge>{TEXT_FIELDS.length} texts</Badge>}
        actions={<SearchInput value={query} onChange={setQuery} placeholder="Search texts" className="w-64" />}
      />

      {shownGroups.length === 0 && <EmptyState icon={SearchX} title="No matching text" description="Try another search." />}

      {shownGroups.map((group) => (
        <Panel key={group} icon={Type} title={group} description={`Text in the ${group.toLowerCase()}.`}>
          <div className="grid gap-5 md:grid-cols-2">
            {TEXT_FIELDS.filter((f) => f.group === group && matches(f)).map((f) => (
              <TextField
                key={f.key}
                label={f.label}
                hint={f.hint}
                value={settings.text[f.key]}
                onChange={(v) => set(f.key, v)}
                error={errors[`text.${f.key}`]}
                max={f.max}
                className={f.max > 100 ? 'md:col-span-2' : undefined}
              />
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}
