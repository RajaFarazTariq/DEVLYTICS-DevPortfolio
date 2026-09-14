import { useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';
import type { SkillGroupContent } from '@/data/skills';
import { skillIcons, type SkillIconName } from '@/data/skillIcons';
import { SKILL_ACCENTS, emptySkillGroup, uniqueSlug } from '@/admin/lib/content';
import { idIssues, validateSkillGroup, type Issue } from '@/admin/lib/validate';
import { slugify } from '@/admin/lib/images';
import type { Confirm, Focus } from '@/admin/types';
import { useItemEditor } from '@/admin/hooks/useItemEditor';
import {
  Badge,
  Drawer,
  EmptyState,
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

  return (
    <div>
      <SectionHeader
        title="Skills"
        description="Skill groups and proficiency bars in the Skills Stack section."
        actions={
          <button type="button" className="adm-btn-primary" onClick={add}>
            <Plus className="h-4 w-4" /> Add group
          </button>
        }
      />

      {groups.length === 0 ? (
        <EmptyState title="No skill groups" description="Add a group such as Frontend or Databases." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map((g, i) => {
            const Icon = skillIcons[g.icon] ?? skillIcons.Wrench;
            const count = issues.filter((x) => x.index === i).length;
            return (
              <article key={`${g.id}-${i}`} className="adm-card flex flex-col">
                <div className="flex-1 p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03]">
                      <Icon className={cn('h-5 w-5', g.accent)} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display font-semibold text-ink-50">{g.title || 'Untitled group'}</h3>
                      <p className="text-xs text-ink-500">{g.items.length} skills</p>
                    </div>
                    {count > 0 && <Badge tone="danger">{count}</Badge>}
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {g.items.slice(0, 5).map((s, k) => (
                      <li key={k}>
                        <div className="flex justify-between text-xs">
                          <span className="truncate text-ink-300">{s.name}</span>
                          <span className="font-mono text-ink-500">{s.level}%</span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full bg-gradient-to-r from-accent-500 via-violet-500 to-pink-500" style={{ width: `${Math.min(100, Math.max(0, s.level))}%` }} />
                        </div>
                      </li>
                    ))}
                    {g.items.length > 5 && <li className="text-xs text-ink-500">+{g.items.length - 5} more</li>}
                  </ul>
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.06] px-2 py-1.5">
                  <span className="px-2 font-mono text-[11px] text-ink-500">#{i + 1}</span>
                  <div className="flex items-center">
                    <ReorderButtons index={i} length={groups.length} label={g.title || `group ${i + 1}`} onMove={(a, b) => onChange(moveItem(groups, a, b))} onDelete={() => remove(i)} />
                    <button type="button" className="adm-icon-btn" onClick={() => editor.open(i, g)} aria-label={`Edit ${g.title}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
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
      <div className="grid gap-5 sm:grid-cols-2">
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
          className="font-mono"
        />
      </div>

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
                  'grid aspect-square place-items-center rounded-xl border transition',
                  value.icon === name ? 'border-accent-400/70 bg-accent-500/15' : 'border-white/10 hover:border-white/25',
                )}
              >
                <Icon className={cn('h-5 w-5', value.icon === name ? value.accent : 'text-ink-300')} />
              </button>
            );
          })}
        </div>
        {errors.icon && <p className="mt-1.5 text-xs text-rose-300">{errors.icon}</p>}
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
                  'grid h-10 w-10 place-items-center rounded-xl border transition',
                  value.accent === accent ? 'border-accent-400/70 bg-white/[0.06]' : 'border-white/10 hover:border-white/25',
                )}
              >
                <Icon className={cn('h-5 w-5', accent)} />
              </button>
            );
          })}
        </div>
        {errors.accent && <p className="mt-1.5 text-xs text-rose-300">{errors.accent}</p>}
      </div>

      <div>
        <div className="adm-label">
          <span>Skills</span>
          <span className="text-ink-500">Level 0–100</span>
        </div>
        <div className="space-y-2">
          {value.items.map((item, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] p-2 sm:flex-nowrap">
              <input
                value={item.name}
                onChange={(e) => setItem(i, { name: e.target.value })}
                placeholder="Skill name"
                aria-label={`Skill ${i + 1} name`}
                aria-invalid={!!errors[`items.${i}.name`]}
                className="adm-input min-w-0 flex-1"
              />
              <input
                type="range"
                min={0}
                max={100}
                value={Number.isFinite(item.level) ? item.level : 0}
                onChange={(e) => setItem(i, { level: Number(e.target.value) })}
                aria-label={`Skill ${i + 1} level`}
                className="w-28 accent-accent-500"
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
                className="adm-input w-20 px-2 text-center font-mono"
              />
              <ReorderButtons
                index={i}
                length={value.items.length}
                label={item.name || `skill ${i + 1}`}
                onMove={(a, b) => onChange({ ...value, items: moveItem(value.items, a, b) })}
                onDelete={() => onChange({ ...value, items: value.items.filter((_, k) => k !== i) })}
              />
            </div>
          ))}
        </div>
        {errors.items && <p className="mt-1.5 text-xs text-rose-300">{errors.items}</p>}
        <button type="button" className="adm-btn-ghost mt-2 px-2 text-xs" onClick={() => onChange({ ...value, items: [...value.items, { name: '', level: 80 }] })}>
          <Plus className="h-3.5 w-3.5" /> Add skill
        </button>
      </div>
    </>
  );
}
