import { GripVertical, LayoutGrid, Plus, ScrollText, Type } from 'lucide-react';
import { pillarTones, type About, type AboutPillar, type MarqueeItem } from '@/data/about';
import { skillIcons, type SkillIconName } from '@/data/skillIcons';
import { techColors, techIcons, type TechColor } from '@/data/techIcons';
import { PILLAR_TONES } from '@/admin/lib/content';
import { LIMITS, fieldErrors, type Issue } from '@/admin/lib/validate';
import { useDragReorder } from '@/admin/hooks/useDragReorder';
import {
  Badge,
  IssueList,
  LineListEditor,
  Panel,
  ReorderButtons,
  SectionHeader,
  SelectField,
  TextField,
  moveItem,
} from '@/admin/components/ui';
import { cn } from '@/utils/cn';

const ICON_OPTIONS = (Object.keys(skillIcons) as SkillIconName[]).map((k) => ({ value: k, label: k }));
const TECH_ICON_OPTIONS = Object.entries(techIcons)
  .map(([value, { label }]) => ({ value, label }))
  .sort((a, b) => a.label.localeCompare(b.label));
const COLOR_OPTIONS = (Object.keys(techColors) as TechColor[]).map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) }));

export function AboutSection({
  about,
  onChange,
  issues,
}: {
  about: About;
  onChange: (about: About) => void;
  issues: Issue[];
}) {
  const errors = fieldErrors(issues);
  const set = <K extends keyof About>(key: K, value: About[K]) => onChange({ ...about, [key]: value });
  const setPillar = (i: number, patch: Partial<AboutPillar>) =>
    set('pillars', about.pillars.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const pillarDrag = useDragReorder((a, b) => set('pillars', moveItem(about.pillars, a, b)));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Content"
        title="About"
        description="The bio card, discipline cards and the Tools & Technologies marquee in the About section. The heading above them is edited on the Sections page; the stats under the bio on Profile & Contact."
        meta={issues.length > 0 ? <Badge tone="danger">{issues.length} to fix</Badge> : undefined}
      />

      <Panel icon={ScrollText} title="Bio" description="The large card on the left of the About section.">
        <TextField label="Card heading" value={about.heading} onChange={(v) => set('heading', v)} error={errors.heading} max={LIMITS.short} />
        <LineListEditor
          label="Paragraphs"
          values={about.paragraphs}
          onChange={(v) => set('paragraphs', v)}
          addLabel="Add paragraph"
          rows={4}
          error={errors.paragraphs}
          hint="Each box is one paragraph. Empty boxes are ignored."
        />
      </Panel>

      <Panel
        icon={LayoutGrid}
        title="Discipline cards"
        description="The stacked cards to the right of the bio. Drag to reorder."
        aside={
          <button
            type="button"
            className="adm-btn-secondary adm-btn-sm"
            onClick={() => set('pillars', [...about.pillars, { icon: 'Code2', title: '', description: '', tone: 'blue' }])}
          >
            <Plus className="h-3.5 w-3.5" /> Add card
          </button>
        }
        flush
      >
        {about.pillars.length === 0 && <p className="px-6 py-8 text-center text-sm text-ink-400">No cards — the right column will be empty.</p>}
        {about.pillars.map((p, i) => {
          const tone = pillarTones[p.tone] ?? pillarTones.blue;
          const Icon = skillIcons[p.icon] ?? skillIcons.Code2;
          return (
            <div key={i} {...pillarDrag.itemProps(i)} className={cn('adm-table-row space-y-4 rounded-none', pillarDrag.stateClass(i))}>
              <div className="flex items-start gap-3">
                <GripVertical className="mt-3 h-4 w-4 shrink-0 cursor-grab text-ink-600" aria-hidden />
                <div className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ring-1 ring-white/10', tone.accent)}>
                  <Icon className={cn('h-5 w-5', tone.iconColor)} />
                </div>
                <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
                  <TextField label="Title" value={p.title} onChange={(title) => setPillar(i, { title })} error={errors[`pillars.${i}.title`]} max={60} />
                  <div className="grid grid-cols-2 gap-3">
                    <SelectField label="Icon" value={p.icon} options={ICON_OPTIONS} onChange={(icon) => setPillar(i, { icon })} error={errors[`pillars.${i}.icon`]} />
                    <SelectField label="Colour" value={p.tone} options={PILLAR_TONES} onChange={(t) => setPillar(i, { tone: t })} error={errors[`pillars.${i}.tone`]} />
                  </div>
                  <TextField
                    label="Description"
                    value={p.description}
                    onChange={(description) => setPillar(i, { description })}
                    error={errors[`pillars.${i}.description`]}
                    max={LIMITS.summary}
                    className="sm:col-span-2"
                  />
                </div>
                <div className="pt-6">
                  <ReorderButtons
                    index={i}
                    length={about.pillars.length}
                    label={p.title || `card ${i + 1}`}
                    onMove={(a, b) => set('pillars', moveItem(about.pillars, a, b))}
                    onDelete={() => set('pillars', about.pillars.filter((_, k) => k !== i))}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </Panel>

      <Panel icon={Type} title="Tools & Technologies marquee" description="The two scrolling rows of chips under the About cards.">
        <TextField
          label="Label above the marquee"
          value={about.marqueeLabel}
          onChange={(v) => set('marqueeLabel', v)}
          error={errors.marqueeLabel}
          hint="Leave empty to show no label."
        />
        <MarqueeEditor title="Top row (scrolls right)" field="tools" items={about.tools} onChange={(v) => set('tools', v)} errors={errors} />
        <MarqueeEditor title="Bottom row (scrolls left)" field="technologies" items={about.technologies} onChange={(v) => set('technologies', v)} errors={errors} />
      </Panel>

      {issues.length > 0 && <IssueList messages={issues.map((i) => i.message)} />}
    </div>
  );
}

const MARQUEE_COLUMNS = 'sm:grid-cols-[1.25rem_minmax(0,1fr)_minmax(0,1fr)_7.5rem_auto]';

function MarqueeEditor({
  title,
  field,
  items,
  onChange,
  errors,
}: {
  title: string;
  field: 'tools' | 'technologies';
  items: MarqueeItem[];
  onChange: (items: MarqueeItem[]) => void;
  errors: Record<string, string>;
}) {
  const drag = useDragReorder((a, b) => onChange(moveItem(items, a, b)));
  const setItem = (i: number, patch: Partial<MarqueeItem>) => onChange(items.map((m, k) => (k === i ? { ...m, ...patch } : m)));

  return (
    <div>
      <div className="adm-label">
        <span>{title}</span>
        <span className="font-mono text-[10.5px] text-ink-500">{items.length} items</span>
      </div>

      {/* Live preview, styled like the site's chips */}
      <div className="mb-3 flex flex-wrap gap-2 rounded-xl border border-white/[0.06] bg-ink-950/50 p-3">
        {items.length === 0 && <span className="text-xs text-ink-500">Empty row</span>}
        {items.map((m, i) => {
          const Icon = techIcons[m.icon]?.Icon ?? techIcons.Wrench.Icon;
          return (
            <span key={i} className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-ink-200">
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: techColors[m.color] ?? techColors.blue }} aria-hidden />
              {m.name || 'Untitled'}
            </span>
          );
        })}
      </div>

      {items.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/[0.07]">
          <div className={`adm-table-head px-3 sm:grid sm:gap-2 ${MARQUEE_COLUMNS}`}>
            <span />
            <span>Name</span>
            <span>Icon</span>
            <span>Colour</span>
            <span className="w-[6.75rem]" />
          </div>
          {items.map((m, i) => (
            <div key={i} {...drag.itemProps(i)} className={cn(`adm-table-row grid items-center gap-2 px-3 py-2.5 ${MARQUEE_COLUMNS}`, drag.stateClass(i))}>
              <GripVertical className="hidden h-4 w-4 cursor-grab text-ink-600 sm:block" aria-hidden />
              <input
                value={m.name}
                onChange={(e) => setItem(i, { name: e.target.value })}
                placeholder="Name"
                aria-label={`Item ${i + 1} name`}
                aria-invalid={!!errors[`${field}.${i}.name`]}
                className="adm-input min-w-0 py-2"
              />
              <select
                value={m.icon}
                onChange={(e) => setItem(i, { icon: e.target.value })}
                aria-label={`Item ${i + 1} icon`}
                aria-invalid={!!errors[`${field}.${i}.icon`]}
                className="adm-input min-w-0 appearance-none py-2"
              >
                {!(m.icon in techIcons) && <option value={m.icon}>Choose…</option>}
                {TECH_ICON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-ink-900">
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={m.color}
                onChange={(e) => setItem(i, { color: e.target.value as TechColor })}
                aria-label={`Item ${i + 1} colour`}
                className="adm-input min-w-0 appearance-none py-2"
                style={{ color: techColors[m.color] }}
              >
                {COLOR_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-ink-900" style={{ color: techColors[o.value] }}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ReorderButtons
                index={i}
                length={items.length}
                label={m.name || `item ${i + 1}`}
                onMove={(a, b) => onChange(moveItem(items, a, b))}
                onDelete={() => onChange(items.filter((_, k) => k !== i))}
              />
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        className="adm-btn-secondary adm-btn-sm mt-2.5 border-dashed"
        onClick={() => onChange([...items, { name: '', icon: 'Code2', color: 'blue' }])}
      >
        <Plus className="h-3.5 w-3.5" /> Add item
      </button>
    </div>
  );
}
