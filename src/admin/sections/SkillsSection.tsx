import { useEffect, useState } from 'react';
import { GripVertical, Pencil, Plus, Sparkles } from 'lucide-react';
import type { SkillGroupContent } from '@/data/skills';
import { skillIcons, type SkillIconName } from '@/data/skillIcons';
import { SKILL_ACCENTS, emptySkillGroup, uniqueSlug } from '@/admin/lib/content';
import { idIssues, validateSkillGroup, type Issue } from '@/admin/lib/validate';
import { slugify } from '@/admin/lib/images';
import type { Confirm, Focus } from '@/admin/types';
import { useItemEditor } from '@/admin/hooks/useItemEditor';
import { useDragReorder } from '@/admin/hooks/useDragReorder';
import {
  Badge,
  Drawer,
  EmptyState,
  FormSection,
  IssueList,
  ReorderButtons,
  SectionHeader,
  TextField,
  moveItem,
} from '@/admin/components/ui';
import { cn } from '@/utils/cn';

export function SkillsSection({
  groups,
  onChange,
  issues,
  confirm,
  focus,
}: {
  groups: SkillGroupContent[];
  onChange: (groups: SkillGroupContent[]) => void;
  issues: Issue[];
  confirm: Confirm;
  focus: Focus;
}) {
  const editor = useItemEditor<SkillGroupContent>({
    list: groups,
    onChange,
    confirm,
    validate: (item, index, others) => [
      ...idIssues('skills', item.id, others.map((o) => o.id), index, 'Skill group'),
      ...validateSkillGroup(item, index),
    ],
  });

  useEffect(() => {
    if (focus?.index !== undefined && groups[focus.index]) editor.open(focus.index, groups[focus.index], true);
  }, [focus?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const add = () => editor.open(null, emptySkillGroup(uniqueSlug('new-group', groups.map((g) => g.id))));

  const remove = (i: number) =>
    confirm({
      title: `Delete "${groups[i].title || groups[i].id}"?`,
      message: `This removes the group and its ${groups[i].items.length} skills when you publish.`,
      confirmLabel: 'Delete group',
      danger: true,
      onConfirm: () => onChange(groups.filter((_, k) => k !== i)),
    });

  const skillTotal = groups.reduce((n, g) => n + g.items.length, 0);
  const drag = useDragReorder((a, b) => onChange(moveItem(groups, a, b)));

  return (
    <div>
      <SectionHeader
        eyebrow="Content"
        title="Skills"
        description="Skill groups and proficiency bars in the Skills section. Drag cards to reorder groups; open a group to add, edit or reorder its skills."
        meta={<Badge>{skillTotal} skills · {groups.length} groups</Badge>}
        actions={
          <button type="button" className="adm-btn-primary" onClick={add}>
            <Plus className="h-4 w-4" /> Add group
          </button>
        }
      />

      {groups.length === 0 ? (
        <EmptyState icon={Sparkles} title="No skill groups" description="Add a group such as Frontend or Databases." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g, i) => {
            const Icon = skillIcons[g.icon] ?? skillIcons.Wrench;
            const count = issues.filter((x) => x.index === i).length;
            return (
              <article key={`${g.id}-${i}`} {...drag.itemProps(i)} className={cn('adm-card adm-card-interactive flex flex-col', count > 0 && 'border-rose-400/25', drag.stateClass(i))}>
                <button type="button" onClick={() => editor.open(i, g)} className="flex-1 p-5 text-left">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                      <Icon className={cn('h-5 w-5', g.accent)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-[15px] font-semibold text-ink-50">{g.title || 'Untitled group'}</h3>
                      <p className="text-xs text-ink-400">{g.items.length} skills</p>
                    </div>
                    {count > 0 && <Badge tone="danger">{count}</Badge>}
                  </div>
                  <ul className="mt-5 space-y-3">
                    {g.items.slice(0, 5).map((s, k) => (
                      <li key={k}>
                        <div className="flex justify-between gap-3 text-xs">
                          <span className="truncate text-ink-300">{s.name}</span>
                          <span className="font-mono tabular-nums text-ink-400">{s.level}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-gradient-to-r from-accent-500 via-violet-500 to-pink-500" style={{ width: `${Math.min(100, Math.max(0, s.level))}%` }} />
                        </div>
                      </li>
                    ))}
                    {g.items.length > 5 && <li className="text-xs text-ink-500">+{g.items.length - 5} more</li>}
                  </ul>
                </button>
                <div className="flex items-center justify-between border-t border-white/[0.06] px-2.5 py-2">
                  <span className="inline-flex items-center gap-1 px-2 font-mono text-[11px] text-ink-500">
                    <GripVertical className="h-3.5 w-3.5 cursor-grab" aria-hidden />#{i + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <ReorderButtons index={i} length={groups.length} label={g.title || `group ${i + 1}`} onMove={(a, b) => onChange(moveItem(groups, a, b))} onDelete={() => remove(i)} />
                    <button type="button" className="adm-icon-btn" onClick={() => editor.open(i, g)} aria-label={`Edit ${g.title}`} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          <button
            type="button"
            onClick={add}
            className="flex min-h-[16rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.01] text-ink-400 transition hover:border-accent-400/40 hover:bg-accent-500/[0.04] hover:text-ink-100"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium">Add group</span>
          </button>
        </div>
      )}

      <Drawer
        open={!!editor.editing}
        title={editor.isNew ? 'New skill group' : 'Edit skill group'}
        onClose={editor.close}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="adm-btn-secondary" onClick={editor.close}>Cancel</button>
            <button type="button" className="adm-btn-primary" onClick={editor.apply}>
              {editor.isNew ? 'Add group' : 'Apply changes'}
            </button>
          </div>
        }
      >
        {editor.editing && (
          <SkillGroupForm
            value={editor.editing}
            onChange={editor.set}
            errors={editor.errors}
            issues={editor.issues}
            isNew={editor.isNew}
            otherIds={groups.map((g) => g.id)}
          />
        )}
      </Drawer>
    </div>
  );
}

const SKILL_COLUMNS = 'sm:grid-cols-[minmax(0,1fr)_7rem_4.5rem_auto]';

function SkillGroupForm({
  value,
  onChange,
  errors,
  issues,
  isNew,
  otherIds,
}: {
  value: SkillGroupContent;
  onChange: (g: SkillGroupContent) => void;
  errors: Record<string, string>;
  issues: Issue[];
  isNew: boolean;
  otherIds: string[];
}) {
  const [idTouched, setIdTouched] = useState(!isNew);
  const setItem = (i: number, patch: Partial<SkillGroupContent['items'][number]>) =>
    onChange({ ...value, items: value.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });

  return (
    <>
      {issues.length > 0 && <IssueList messages={issues.map((i) => i.message)} />}

      <FormSection title="Group">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Group title"
            value={value.title}
            autoFocus={isNew}
            onChange={(title) =>
              onChange({ ...value, title, id: idTouched ? value.id : uniqueSlug(slugify(title) || 'new-group', otherIds) })
            }
            error={errors.title}
          />
          <TextField
            label="ID"
            value={value.id}
            onChange={(id) => {
              setIdTouched(true);
              onChange({ ...value, id });
            }}
            error={errors.id}
            inputClassName="font-mono"
          />
        </div>
      </FormSection>

      <FormSection title="Appearance">
        <div>
          <div className="adm-label">Icon</div>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
            {(Object.keys(skillIcons) as SkillIconName[]).map((name) => {
              const Icon = skillIcons[name];
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  aria-label={name}
                  aria-pressed={value.icon === name}
                  onClick={() => onChange({ ...value, icon: name })}
                  className={cn(
                    'grid aspect-square place-items-center rounded-lg border transition',
                    value.icon === name ? 'border-accent-400/70 bg-accent-500/15 ring-2 ring-accent-400/20' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/25',
                  )}
                >
                  <Icon className={cn('h-5 w-5', value.icon === name ? value.accent : 'text-ink-300')} />
                </button>
              );
            })}
          </div>
          {errors.icon && <p className="adm-error">{errors.icon}</p>}
        </div>

        <div>
          <div className="adm-label">Icon colour</div>
          <div className="flex flex-wrap gap-2">
            {[...new Set([value.accent, ...SKILL_ACCENTS])].filter(Boolean).map((accent) => {
              const Icon = skillIcons[value.icon] ?? skillIcons.Wrench;
              return (
                <button
                  key={accent}
                  type="button"
                  title={accent}
                  aria-label={accent}
                  aria-pressed={value.accent === accent}
                  onClick={() => onChange({ ...value, accent })}
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-lg border transition',
                    value.accent === accent ? 'border-accent-400/70 bg-white/[0.06] ring-2 ring-accent-400/20' : 'border-white/[0.08] bg-white/[0.02] hover:border-white/25',
                  )}
                >
                  <Icon className={cn('h-5 w-5', accent)} />
                </button>
              );
            })}
          </div>
          {errors.accent && <p className="adm-error">{errors.accent}</p>}
        </div>
      </FormSection>

      <FormSection title="Skills" aside={<span className="font-mono text-[10.5px] text-ink-500">{value.items.length} · level 0–100</span>}>
        {value.items.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/[0.07]">
            <div className={`adm-table-head px-3 sm:grid sm:gap-2 ${SKILL_COLUMNS}`}>
              <span>Skill</span>
              <span>Level</span>
              <span className="text-center">%</span>
              <span className="w-[6.75rem]" />
            </div>
            {value.items.map((item, i) => (
              <div key={i} className={`adm-table-row grid items-center gap-2 px-3 py-2.5 ${SKILL_COLUMNS}`}>
                <input
                  value={item.name}
                  onChange={(e) => setItem(i, { name: e.target.value })}
                  placeholder="Skill name"
                  aria-label={`Skill ${i + 1} name`}
                  aria-invalid={!!errors[`items.${i}.name`]}
                  className="adm-input min-w-0 py-2"
                />
                <div className="flex items-center gap-2 sm:contents">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Number.isFinite(item.level) ? item.level : 0}
                    onChange={(e) => setItem(i, { level: Number(e.target.value) })}
                    aria-label={`Skill ${i + 1} level`}
                    className="min-w-0 flex-1 accent-accent-500"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={Number.isFinite(item.level) ? item.level : ''}
                    onChange={(e) => setItem(i, { level: e.target.value === '' ? NaN : Number(e.target.value) })}
                    aria-label={`Skill ${i + 1} level number`}
                    aria-invalid={!!errors[`items.${i}.level`]}
                    className="adm-input w-[4.5rem] px-2 py-2 text-center font-mono"
                  />
                  <ReorderButtons
                    index={i}
                    length={value.items.length}
                    label={item.name || `skill ${i + 1}`}
                    onMove={(a, b) => onChange({ ...value, items: moveItem(value.items, a, b) })}
                    onDelete={() => onChange({ ...value, items: value.items.filter((_, k) => k !== i) })}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        {errors.items && <p className="adm-error">{errors.items}</p>}
        <button type="button" className="adm-btn-secondary adm-btn-sm border-dashed" onClick={() => onChange({ ...value, items: [...value.items, { name: '', level: 80 }] })}>
          <Plus className="h-3.5 w-3.5" /> Add skill
        </button>
      </FormSection>
    </>
  );
}
