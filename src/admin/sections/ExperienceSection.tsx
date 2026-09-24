import { useEffect, useState } from 'react';
import { Briefcase, GraduationCap, GripVertical, MapPin, Pencil, Plus } from 'lucide-react';
import { pillarIcon, pillarStyle, pillarStyles, type ExperienceItem, type Pillar } from '@/data/experience';
import { skillIcons, type SkillIconName } from '@/data/skillIcons';
import { LIMITS, idIssues, validateExperience, type Issue } from '@/admin/lib/validate';
import { PILLAR_STYLE_OPTIONS, emptyExperience, uniqueSlug } from '@/admin/lib/content';
import { slugify } from '@/admin/lib/images';
import type { Confirm, Focus } from '@/admin/types';
import { useItemEditor } from '@/admin/hooks/useItemEditor';
import { useDragReorder } from '@/admin/hooks/useDragReorder';
import {
  Badge,
  Drawer,
  EmptyState,
  FilterTabs,
  FormSection,
  IssueList,
  LineListEditor,
  ReorderButtons,
  SectionHeader,
  SelectField,
  TagInput,
  TextAreaField,
  TextField,
  Toggle,
  moveItem,
} from '@/admin/components/ui';
import { cn } from '@/utils/cn';

const ROW_COLUMNS = 'md:grid-cols-[minmax(0,1fr)_10rem_11rem_9.5rem]';

// "2022 — Present" <-> { start, end }. Anything else (e.g. "Graduated") is kept as custom text.
const PERIOD = /^(.+?)\s+[—–-]\s+(.+)$/;
const PRESENT = 'Present';

function parsePeriod(period: string) {
  const m = PERIOD.exec(period.trim());
  return m ? { start: m[1], end: m[2] } : null;
}

const isCurrent = (period: string) => parsePeriod(period)?.end.toLowerCase() === PRESENT.toLowerCase();

export function ExperienceSection({
  items,
  onChange,
  issues,
  confirm,
  focus,
}: {
  items: ExperienceItem[];
  onChange: (items: ExperienceItem[]) => void;
  issues: Issue[];
  confirm: Confirm;
  focus: Focus;
}) {
  const editor = useItemEditor<ExperienceItem>({
    list: items,
    onChange,
    confirm,
    validate: (item, index, others) => [
      ...idIssues('experience', item.id, others.map((o) => o.id), index, 'Entry'),
      ...validateExperience(item, index),
    ],
  });

  useEffect(() => {
    if (focus?.index !== undefined && items[focus.index]) editor.open(focus.index, items[focus.index], true);
  }, [focus?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = (type: ExperienceItem['type']) =>
    editor.open(null, emptyExperience(uniqueSlug(type === 'work' ? 'new-role' : 'new-education', items.map((e) => e.id)), type));

  const remove = (i: number) =>
    confirm({
      title: `Delete "${items[i].role || items[i].id}"?`,
      message: 'This entry is removed from the Experience & Education section when you publish.',
      confirmLabel: 'Delete entry',
      danger: true,
      onConfirm: () => onChange(items.filter((_, k) => k !== i)),
    });

  const workCount = items.filter((e) => e.type === 'work').length;

  const [filter, setFilter] = useState<'all' | ExperienceItem['type']>('all');
  const rows = items.map((e, i) => ({ e, i })).filter(({ e }) => filter === 'all' || e.type === filter);
  const drag = useDragReorder((a, b) => onChange(moveItem(items, a, b)), filter === 'all');

  return (
    <div>
      <SectionHeader
        eyebrow="Content"
        title="Experience & Education"
        description="Timeline cards, shown in this order. Work and education entries share one list — drag rows to reorder."
        meta={<Badge>{workCount} work · {items.length - workCount} education</Badge>}
        actions={
          <>
            <button type="button" className="adm-btn-secondary" onClick={() => add('education')}>
              <GraduationCap className="h-4 w-4" /> Add education
            </button>
            <button type="button" className="adm-btn-primary" onClick={() => add('work')}>
              <Plus className="h-4 w-4" /> Add experience
            </button>
          </>
        }
      />

      {items.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <FilterTabs
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All', count: items.length },
              { value: 'work', label: 'Work', count: workCount },
              { value: 'education', label: 'Education', count: items.length - workCount },
            ]}
          />
          {filter !== 'all' && <span className="text-xs text-ink-500">Switch to All to drag-reorder.</span>}
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState icon={Briefcase} title="Nothing here yet" description="Add your work experience or education." />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={filter === 'education' ? GraduationCap : Briefcase}
          title={filter === 'education' ? 'No education entries' : 'No work entries'}
          description="Use the buttons above to add one."
        />
      ) : (
        <div className="adm-card overflow-hidden">
          <div className={`adm-table-head md:grid md:gap-4 ${ROW_COLUMNS}`}>
            <span>Entry</span>
            <span>Period</span>
            <span>Location</span>
            <span className="text-right">Actions</span>
          </div>
          {rows.map(({ e, i }) => {
            const Icon = e.type === 'education' ? GraduationCap : Briefcase;
            const count = issues.filter((x) => x.index === i).length;
            return (
              <div key={`${e.id}-${i}`} {...drag.itemProps(i)} className={cn('adm-table-row grid items-center gap-3 md:gap-4', ROW_COLUMNS, drag.stateClass(i))}>
                <button type="button" onClick={() => editor.open(i, e)} className="flex min-w-0 items-center gap-3 text-left">
                  {filter === 'all' && <GripVertical className="-ml-2 hidden h-4 w-4 shrink-0 cursor-grab text-ink-600 md:block" aria-hidden />}
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-cyan-400/20 bg-cyan-500/[0.06]">
                    <Icon className="h-4 w-4 text-cyan-300" />
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-display text-[15px] font-semibold text-ink-50">{e.role || 'Untitled'}</span>
                      <Badge tone={e.type === 'education' ? 'neutral' : 'accent'}>{e.type === 'education' ? 'Education' : 'Work'}</Badge>
                      {isCurrent(e.period) && <Badge tone="success">Current</Badge>}
                      {count > 0 && <Badge tone="danger">{count} issue{count > 1 ? 's' : ''}</Badge>}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-ink-400">{e.company}</span>
                  </span>
                </button>
                <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300/90 max-md:pl-[3.25rem]">{e.period}</span>
                <span className="min-w-0 text-sm text-ink-400 max-md:hidden">
                  {e.location ? (
                    <span className="inline-flex max-w-full items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{e.location}</span>
                    </span>
                  ) : (
                    <span className="text-ink-600">—</span>
                  )}
                </span>
                <div className="flex items-center justify-end gap-1 max-md:-mt-1">
                  <ReorderButtons index={i} length={items.length} label={e.role || `entry ${i + 1}`} onMove={(a, b) => onChange(moveItem(items, a, b))} onDelete={() => remove(i)} />
                  <button type="button" className="adm-icon-btn" onClick={() => editor.open(i, e)} aria-label={`Edit ${e.role}`} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Drawer
        open={!!editor.editing}
        title={editor.isNew ? (editor.editing?.type === 'education' ? 'New education' : 'New experience') : 'Edit entry'}
        onClose={editor.close}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="adm-btn-secondary" onClick={editor.close}>Cancel</button>
            <button type="button" className="adm-btn-primary" onClick={editor.apply}>
              {editor.isNew ? 'Add entry' : 'Apply changes'}
            </button>
          </div>
        }
      >
        {editor.editing && (
          <ExperienceForm
            value={editor.editing}
            onChange={editor.set}
            errors={editor.errors}
            issues={editor.issues}
            isNew={editor.isNew}
            otherIds={items.map((x) => x.id)}
          />
        )}
      </Drawer>
    </div>
  );
}

function ExperienceForm({
  value,
  onChange,
  errors,
  issues,
  isNew,
  otherIds,
}: {
  value: ExperienceItem;
  onChange: (e: ExperienceItem) => void;
  errors: Record<string, string>;
  issues: Issue[];
  isNew: boolean;
  otherIds: string[];
}) {
  const [idTouched, setIdTouched] = useState(!isNew);
  const isEducation = value.type === 'education';
  const pillars = value.pillars ?? [];
  const set = <K extends keyof ExperienceItem>(key: K, v: ExperienceItem[K]) => onChange({ ...value, [key]: v });
  const setPillar = (i: number, patch: Partial<Pillar>) =>
    set('pillars', pillars.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const addPillar = () =>
    set('pillars', [...pillars, { key: uniqueSlug('column', pillars.map((p) => p.key)), name: '', description: '', bullets: [], stack: [], icon: 'Code2', style: 'cyan' }]);

  return (
    <>
      {issues.length > 0 && <IssueList messages={issues.map((i) => i.message)} />}

      <FormSection title="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Type"
            value={value.type}
            options={[
              { value: 'work', label: 'Work experience' },
              { value: 'education', label: 'Education' },
            ]}
            onChange={(v) => set('type', v)}
            error={errors.type}
          />
          <TextField
            label="ID"
            value={value.id}
            onChange={(id) => {
              setIdTouched(true);
              set('id', id);
            }}
            error={errors.id}
            inputClassName="font-mono"
          />
        </div>
        <TextField
          label={isEducation ? 'Degree / programme' : 'Role'}
          value={value.role}
          autoFocus={isNew}
          onChange={(role) =>
            onChange({ ...value, role, id: idTouched ? value.id : uniqueSlug(slugify(role) || value.id, otherIds) })
          }
          error={errors.role}
          max={LIMITS.short}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={isEducation ? 'Institution' : 'Company'} value={value.company} onChange={(v) => set('company', v)} error={errors.company} />
          <TextField label="Location (optional)" value={value.location ?? ''} onChange={(v) => set('location', v)} error={errors.location} />
        </div>
        <PeriodEditor value={value.period} onChange={(v) => set('period', v)} error={errors.period} isEducation={isEducation} />
      </FormSection>

      <FormSection title="Summary & highlights">
        <TextAreaField label="Summary (optional)" value={value.summary ?? ''} onChange={(v) => set('summary', v)} error={errors.summary} max={LIMITS.long} rows={3} />
        <LineListEditor
          label="Highlights (optional)"
          values={value.bullets ?? []}
          onChange={(v) => set('bullets', v)}
          addLabel="Add highlight"
          error={errors.bullets}
        />
        <TagInput
          label="Tags / stack (optional)"
          values={value.stack ?? []}
          onChange={(v) => set('stack', v)}
          error={errors.stack}
          hint={pillars.length ? 'Hidden on the site while disciplines are used — each discipline has its own stack.' : 'Shown as chips under the highlights.'}
        />
      </FormSection>

      <section className="space-y-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink-100">Discipline columns (optional)</p>
            <p className="text-xs text-ink-400">The column breakdown inside an entry (e.g. Web / Data / AI on your main role). Each column has its own icon and colour.</p>
          </div>
          <button type="button" className="adm-btn-secondary adm-btn-sm" onClick={addPillar}>
            <Plus className="h-3.5 w-3.5" /> Add column
          </button>
        </div>
        {pillars.map((p, i) => {
          const style = pillarStyles[pillarStyle(p)] ?? pillarStyles.cyan;
          const Icon = skillIcons[pillarIcon(p)] ?? skillIcons.Code2;
          return (
          <div key={i} className="space-y-4 rounded-xl border border-white/[0.07] bg-ink-950/50 p-4">
            <div className="flex items-end gap-3">
              <span className={cn('mb-1 grid h-10 w-10 shrink-0 place-items-center rounded-lg border bg-ink-900', style.border)}>
                <Icon className={cn('h-4 w-4', style.text)} />
              </span>
              <SelectField
                label="Icon"
                value={pillarIcon(p)}
                options={(Object.keys(skillIcons) as SkillIconName[]).map((k) => ({ value: k, label: k }))}
                onChange={(icon) => setPillar(i, { icon })}
                error={errors[`pillars.${i}.icon`]}
                className="flex-1"
              />
              <SelectField
                label="Colour"
                value={pillarStyle(p)}
                options={PILLAR_STYLE_OPTIONS}
                onChange={(st) => setPillar(i, { style: st })}
                error={errors[`pillars.${i}.style`] ?? errors[`pillars.${i}.key`]}
                className="flex-1"
              />
              <div className="pb-1">
                <ReorderButtons
                  index={i}
                  length={pillars.length}
                  label={p.name || `discipline ${i + 1}`}
                  onMove={(a, b) => set('pillars', moveItem(pillars, a, b))}
                  onDelete={() => set('pillars', pillars.filter((_, k) => k !== i))}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Title" value={p.name} onChange={(name) => setPillar(i, { name })} error={errors[`pillars.${i}.name`]} />
              <TextField label="Short description" value={p.description} onChange={(description) => setPillar(i, { description })} error={errors[`pillars.${i}.description`]} />
            </div>
            <LineListEditor label="Highlights" values={p.bullets} onChange={(bullets) => setPillar(i, { bullets })} addLabel="Add highlight" error={errors[`pillars.${i}.bullets`]} />
            <TagInput label="Stack" values={p.stack} onChange={(stack) => setPillar(i, { stack })} error={errors[`pillars.${i}.stack`]} />
          </div>
          );
        })}
      </section>
    </>
  );
}

/** Start / end / "current" controls that write the period text shown on the site (e.g. "2022 — Present"). */
function PeriodEditor({
  value,
  onChange,
  error,
  isEducation,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  isEducation: boolean;
}) {
  const parsed = parsePeriod(value);
  const [custom, setCustom] = useState(() => value.trim() !== '' && !parsed);
  // Kept locally so a half-filled pair (only a start, or only an end) isn't lost between renders.
  const [start, setStart] = useState(parsed?.start ?? (parsed ? '' : value.trim()));
  const [end, setEnd] = useState(parsed?.end ?? '');
  const current = end.toLowerCase() === PRESENT.toLowerCase();
  const write = (s: string, e: string) => {
    setStart(s);
    setEnd(e);
    onChange(s.trim() && e.trim() ? `${s.trim()} — ${e.trim()}` : s.trim() || e.trim());
  };

  return (
    <div className="space-y-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-100">Period</p>
        <FilterTabs
          value={custom ? 'custom' : 'dates'}
          onChange={(v) => setCustom(v === 'custom')}
          options={[
            { value: 'dates', label: 'Start / end' },
            { value: 'custom', label: 'Custom text' },
          ]}
        />
      </div>
      {custom ? (
        <TextField
          label="Period text"
          value={value}
          onChange={onChange}
          error={error}
          placeholder={isEducation ? 'Graduated' : '2022 — Present'}
          hint="Shown exactly as typed, e.g. “Graduated” or “Summer 2023”."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Start" value={start} onChange={(s) => write(s, end)} placeholder="2022 or Jan 2022" />
            <TextField label="End" value={current ? PRESENT : end} onChange={(e) => write(start, e)} placeholder="2024" disabled={current} />
          </div>
          <Toggle
            checked={current}
            onChange={(on) => write(start, on ? PRESENT : '')}
            label={isEducation ? 'Currently studying here' : 'I currently work here'}
            description="Shows “Present” as the end date."
          />
          <p className="adm-hint">
            Shown on the site as: <span className="font-mono text-cyan-300/90">{value || '—'}</span>
          </p>
          {error && <p className="adm-error">{error}</p>}
        </>
      )}
    </div>
  );
}
