import { useEffect, useState, type ChangeEvent } from 'react';
import { Copy, ExternalLink, Eye, EyeOff, FolderKanban, Github, GripVertical, Images, Loader2, Pencil, Plus, SearchX, Upload } from 'lucide-react';
import type { Project } from '@/data/projects';
import {
  PROJECT_ACCENTS,
  PROJECT_CATEGORIES,
  duplicateProject,
  emptyProject,
  uniqueSlug,
} from '@/admin/lib/content';
import { LIMITS, idIssues, validateProject, type Issue, type ValidationContext } from '@/admin/lib/validate';
import { ACCEPT_IMAGES, prepareUpload, slugify } from '@/admin/lib/images';
import type { Confirm, Focus, MediaApi } from '@/admin/types';
import { useItemEditor } from '@/admin/hooks/useItemEditor';
import { useDragReorder } from '@/admin/hooks/useDragReorder';
import { ImageThumb } from '@/admin/components/ImageThumb';
import {
  Badge,
  Drawer,
  EmptyState,
  FilterTabs,
  FormSection,
  IssueList,
  Modal,
  ReorderButtons,
  SearchInput,
  SectionHeader,
  SelectField,
  TagInput,
  TextAreaField,
  TextField,
  Toggle,
  moveItem,
} from '@/admin/components/ui';
import { cn } from '@/utils/cn';

export function ProjectsSection({
  projects,
  onChange,
  issues,
  ctx,
  media,
  confirm,
  focus,
}: {
  projects: Project[];
  onChange: (projects: Project[]) => void;
  issues: Issue[];
  ctx: ValidationContext;
  media: MediaApi;
  confirm: Confirm;
  focus: Focus;
}) {
  const editor = useItemEditor<Project>({
    list: projects,
    onChange,
    confirm,
    validate: (item, index, others) => [
      ...idIssues('projects', item.id, others.map((o) => o.id), index, 'Project'),
      ...validateProject(item, index, ctx),
    ],
  });

  useEffect(() => {
    if (focus?.index !== undefined && projects[focus.index]) {
      editor.open(focus.index, projects[focus.index], true);
    }
  }, [focus?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const addProject = () =>
    editor.open(null, emptyProject(uniqueSlug('new-project', projects.map((p) => p.id))));

  const remove = (i: number) =>
    confirm({
      title: `Delete "${projects[i].title || projects[i].id}"?`,
      message: 'The project is removed from the carousel when you publish. Its image stays in Media unless you choose to delete it while publishing.',
      confirmLabel: 'Delete project',
      danger: true,
      onConfirm: () => onChange(projects.filter((_, k) => k !== i)),
    });

  const listIssues = issues.filter((i) => i.index === undefined).map((i) => i.message);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'hidden'>('all');
  const [category, setCategory] = useState<'all' | Project['category']>('all');
  const filtering = query.trim() !== '' || status !== 'all' || category !== 'all';
  const q = query.trim().toLowerCase();
  const visible = projects
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => status === 'all' || (status === 'hidden' ? p.hidden : !p.hidden))
    .filter(({ p }) => category === 'all' || p.category === category)
    .filter(({ p }) => !q || [p.title, p.subtitle ?? '', p.summary, ...p.tech].some((t) => t.toLowerCase().includes(q)));
  const hiddenCount = projects.filter((p) => p.hidden).length;

  const drag = useDragReorder((a, b) => onChange(moveItem(projects, a, b)), !filtering);

  const toggleHidden = (i: number) =>
    onChange(projects.map((p, k) => (k === i ? { ...p, hidden: !p.hidden } : p)));

  const duplicate = (i: number) => {
    const copy = duplicateProject(projects[i], projects.map((p) => p.id));
    onChange([...projects.slice(0, i + 1), copy, ...projects.slice(i + 1)]);
  };

  return (
    <div>
      <SectionHeader
        eyebrow="Content"
        title="Projects"
        description="Published projects are shown in the rotating carousel, in this order. Drag cards to reorder."
        meta={
          <Badge>
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            {hiddenCount > 0 ? ` · ${hiddenCount} hidden` : ''}
          </Badge>
        }
        actions={
          <button type="button" className="adm-btn-primary" onClick={addProject}>
            <Plus className="h-4 w-4" /> Add project
          </button>
        }
      />

      {listIssues.length > 0 && (
        <div className="mb-5">
          <IssueList messages={listIssues} />
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Search title, summary or technology" className="sm:max-w-xs sm:flex-1" />
          <FilterTabs
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all', label: 'All', count: projects.length },
              { value: 'published', label: 'Published', count: projects.length - hiddenCount },
              { value: 'hidden', label: 'Hidden', count: hiddenCount },
            ]}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="adm-input h-9 appearance-none py-0 sm:w-48"
            aria-label="Filter by category"
          >
            <option value="all" className="bg-ink-900">All categories</option>
            {PROJECT_CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-ink-900">
                {c}
              </option>
            ))}
          </select>
          {filtering && <span className="text-xs text-ink-500">Clear filters to drag-reorder.</span>}
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects"
          description="The carousel needs at least one project."
          action={
            <button type="button" className="adm-btn-primary" onClick={addProject}>
              <Plus className="h-4 w-4" /> Add project
            </button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={SearchX} title="No matching projects" description="Try another search or filter." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ p, i }) => {
            const count = issues.filter((x) => x.index === i).length;
            return (
              <article
                key={`${p.id}-${i}`}
                {...drag.itemProps(i)}
                className={cn('adm-card adm-card-interactive flex flex-col overflow-hidden', count > 0 && 'border-rose-400/25', p.hidden && 'opacity-70', drag.stateClass(i))}
              >
                <button type="button" onClick={() => editor.open(i, p)} className="relative block text-left">
                  <ImageThumb src={media.resolve(p.image)} fallback={p.image} alt={`${p.title} preview`} background={p.imageBg} className="adm-checker aspect-[16/9] w-full border-b border-white/[0.06]" />
                  <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
                    <span className="flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-white/10 bg-ink-950/75 px-2.5 py-1 text-[11px] font-medium text-ink-100 backdrop-blur">{p.category}</span>
                      {p.hidden && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-ink-950/80 px-2.5 py-1 text-[11px] font-medium text-amber-200 backdrop-blur">
                          <EyeOff className="h-3 w-3" /> Hidden
                        </span>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-ink-950/75 px-1.5 py-0.5 font-mono text-[10.5px] text-ink-300 backdrop-blur">
                      {!filtering && <GripVertical className="h-3 w-3" />}#{i + 1}
                    </span>
                  </div>
                  {count > 0 && (
                    <span className="absolute bottom-3 left-3">
                      <Badge tone="danger">{count} issue{count > 1 ? 's' : ''}</Badge>
                    </span>
                  )}
                </button>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="font-display text-base font-semibold leading-snug text-ink-50">{p.title || 'Untitled project'}</h3>
                  {p.subtitle && <p className="mt-0.5 line-clamp-1 text-xs text-ink-400">{p.subtitle}</p>}
                  <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-ink-300">{p.summary}</p>
                  <div className="mt-auto flex flex-wrap gap-1 pt-4">
                    {p.tech.slice(0, 4).map((t) => (
                      <span key={t} className="rounded-md border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10.5px] text-ink-300">
                        {t}
                      </span>
                    ))}
                    {p.tech.length > 4 && <span className="px-1 py-0.5 font-mono text-[10.5px] text-ink-500">+{p.tech.length - 4}</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] px-2.5 py-2">
                  <div className="flex min-w-0 items-center gap-0.5">
                    {p.links.github && (
                      <a href={p.links.github} target="_blank" rel="noreferrer" className="adm-btn-ghost adm-btn-sm">
                        <Github className="h-3.5 w-3.5" /> Code
                      </a>
                    )}
                    {p.links.demo && (
                      <a href={p.links.demo} target="_blank" rel="noreferrer" className="adm-btn-ghost adm-btn-sm">
                        <ExternalLink className="h-3.5 w-3.5" /> Demo
                      </a>
                    )}
                    {!p.links.github && !p.links.demo && <span className="px-2 text-xs text-ink-500">No links</span>}
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      className="adm-icon-btn"
                      onClick={() => toggleHidden(i)}
                      aria-label={p.hidden ? `Publish ${p.title}` : `Hide ${p.title}`}
                      title={p.hidden ? 'Hidden — click to publish' : 'Published — click to hide'}
                    >
                      {p.hidden ? <EyeOff className="h-4 w-4 text-amber-300" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button type="button" className="adm-icon-btn" onClick={() => duplicate(i)} aria-label={`Duplicate ${p.title}`} title="Duplicate (copy starts hidden)">
                      <Copy className="h-4 w-4" />
                    </button>
                    <ReorderButtons
                      index={i}
                      length={projects.length}
                      label={p.title || `project ${i + 1}`}
                      onMove={(from, to) => onChange(moveItem(projects, from, to))}
                      onDelete={projects.length > 1 ? () => remove(i) : undefined}
                    />
                    <button type="button" className="adm-icon-btn" onClick={() => editor.open(i, p)} aria-label={`Edit ${p.title}`} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          <button
            type="button"
            onClick={addProject}
            className="flex min-h-[18rem] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.01] text-ink-400 transition hover:border-accent-400/40 hover:bg-accent-500/[0.04] hover:text-ink-100"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
              <Plus className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium">Add project</span>
          </button>
        </div>
      )}

      <Drawer
        open={!!editor.editing}
        title={editor.isNew ? 'New project' : 'Edit project'}
        subtitle="Apply saves this project to your draft. Nothing goes live until you publish."
        onClose={editor.close}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="adm-btn-secondary" onClick={editor.close}>Cancel</button>
            <button type="button" className="adm-btn-primary" onClick={editor.apply}>
              {editor.isNew ? 'Add project' : 'Apply changes'}
            </button>
          </div>
        }
      >
        {editor.editing && (
          <ProjectForm
            value={editor.editing}
            onChange={editor.set}
            errors={editor.errors}
            issues={editor.issues}
            isNew={editor.isNew}
            otherIds={projects.map((p) => p.id)}
            media={media}
          />
        )}
      </Drawer>
    </div>
  );
}

function ProjectForm({
  value,
  onChange,
  errors,
  issues,
  isNew,
  otherIds,
  media,
}: {
  value: Project;
  onChange: (p: Project) => void;
  errors: Record<string, string>;
  issues: Issue[];
  isNew: boolean;
  otherIds: string[];
  media: MediaApi;
}) {
  const [idTouched, setIdTouched] = useState(!isNew);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const set = <K extends keyof Project>(key: K, v: Project[K]) => onChange({ ...value, [key]: v });

  const setTitle = (title: string) => {
    const next = { ...value, title };
    if (!idTouched) next.id = uniqueSlug(slugify(title) || 'new-project', otherIds);
    onChange(next);
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const upload = await prepareUpload(file, value.title || value.id);
      media.addUpload(upload);
      onChange({ ...value, image: upload.publicPath });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  const hexBg = /^#[0-9a-f]{6}$/i.test(value.imageBg ?? '') ? value.imageBg! : '#0b0f1e';

  return (
    <>
      {issues.length > 0 && <IssueList messages={issues.map((i) => i.message)} />}

      <FormSection title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Title" value={value.title} onChange={setTitle} error={errors.title} max={LIMITS.short} autoFocus={isNew} />
          <TextField
            label="ID"
            value={value.id}
            onChange={(v) => {
              setIdTouched(true);
              set('id', v);
            }}
            error={errors.id}
            hint="Unique, lowercase-with-dashes. Not shown on the site."
            inputClassName="font-mono"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Subtitle (optional)" value={value.subtitle ?? ''} onChange={(v) => set('subtitle', v)} error={errors.subtitle} max={LIMITS.short} />
          <SelectField
            label="Category"
            value={value.category}
            options={PROJECT_CATEGORIES.map((c) => ({ value: c, label: c }))}
            onChange={(v) => set('category', v)}
            error={errors.category}
          />
        </div>
        <Toggle
          checked={!value.hidden}
          onChange={(published) => onChange({ ...value, hidden: !published })}
          label="Published"
          description={value.hidden ? 'Hidden — saved here but not shown on the site.' : 'Shown in the projects carousel.'}
        />
      </FormSection>

      <FormSection title="Content" description="What visitors read in the carousel.">
        <TextField label="Summary" value={value.summary} onChange={(v) => set('summary', v)} error={errors.summary} max={LIMITS.summary} hint="One line shown above the title." />
        <TextAreaField label="Description" value={value.description} onChange={(v) => set('description', v)} error={errors.description} max={LIMITS.long} rows={5} />
        <TagInput label="Technologies" values={value.tech} onChange={(v) => set('tech', v)} error={errors.tech} placeholder="React, Django…" />
      </FormSection>

      <FormSection title="Project image" aside={<span className="font-mono text-[10.5px] text-ink-500">1200 × 750 works best</span>}>
        <ImageThumb
          src={value.image ? media.resolve(value.image) : ''}
          fallback={value.image}
          alt="Project preview"
          background={value.imageBg}
          className="adm-checker aspect-[16/10] w-full rounded-xl border border-white/[0.08]"
        />
        <div className="flex flex-wrap gap-2">
          <label className={cn('adm-btn-secondary cursor-pointer', uploading && 'pointer-events-none opacity-60')}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload new
            <input type="file" accept={ACCEPT_IMAGES} className="sr-only" onChange={(e) => void onFile(e)} />
          </label>
          <button type="button" className="adm-btn-secondary" onClick={() => setLibraryOpen(true)} disabled={media.items.length === 0}>
            <Images className="h-4 w-4" /> Choose existing
          </button>
        </div>
        {(uploadError || errors.image) && <p className="adm-error">{uploadError ?? errors.image}</p>}
      </FormSection>

      <FormSection title="Links">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="GitHub link (optional)" type="url" value={value.links.github ?? ''} onChange={(v) => set('links', { ...value.links, github: v })} error={errors['links.github']} placeholder="https://github.com/…" />
          <TextField label="Live demo link (optional)" type="url" value={value.links.demo ?? ''} onChange={(v) => set('links', { ...value.links, demo: v })} error={errors['links.demo']} placeholder="https://…" />
        </div>
      </FormSection>

      <details className="group rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3" open={!!(errors.imageBg || errors.image)}>
        <summary className="cursor-pointer select-none text-sm font-medium text-ink-200">Advanced</summary>
        <div className="mt-4 space-y-5">
          <TextField label="Image path or URL" value={value.image} onChange={(v) => set('image', v)} error={errors.image} hint="Set automatically when you upload or choose an image." inputClassName="font-mono" />
          <div className="flex items-start gap-3">
            <TextField
              label="Image background (optional)"
              value={value.imageBg ?? ''}
              onChange={(v) => set('imageBg', v)}
              error={errors.imageBg}
              placeholder="#0b0f1e"
              hint="Only for transparent images designed for a specific backdrop."
              className="flex-1"
            />
            <input type="color" value={hexBg} onChange={(e) => set('imageBg', e.target.value)} className="mt-[26px] h-[42px] w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" aria-label="Pick image background colour" />
          </div>
          <SelectField
            label="Accent gradient"
            value={value.accent}
            options={[...new Set([value.accent, ...PROJECT_ACCENTS])].map((a) => ({ value: a, label: a }))}
            onChange={(v) => set('accent', v)}
            hint="Kept for compatibility — the current carousel design doesn't display it."
          />
        </div>
      </details>

      <Modal open={libraryOpen} title="Choose an image" onClose={() => setLibraryOpen(false)} wide>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {media.items
            .filter((m) => !m.markedForDeletion)
            .map((m) => (
              <button
                key={m.repoPath}
                type="button"
                onClick={() => {
                  onChange({ ...value, image: m.publicPath });
                  setLibraryOpen(false);
                }}
                className={cn(
                  'overflow-hidden rounded-xl border text-left transition hover:border-accent-400/60',
                  m.publicPath === value.image.split(/[?#]/)[0] ? 'border-accent-400/70 ring-2 ring-accent-400/30' : 'border-white/10',
                )}
              >
                <ImageThumb src={media.resolve(m.publicPath)} fallback={m.publicPath} alt={m.name} className="adm-checker aspect-[16/10] w-full" />
                <span className="block truncate px-2 py-1.5 font-mono text-[10px] text-ink-400">{m.name}</span>
              </button>
            ))}
        </div>
      </Modal>
    </>
  );
}
