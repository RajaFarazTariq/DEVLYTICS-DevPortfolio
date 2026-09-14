import { useEffect, useState, type ChangeEvent } from 'react';
import { ExternalLink, Github, Images, Loader2, Pencil, Plus, Upload } from 'lucide-react';
import type { Project } from '@/data/projects';
import {
  PROJECT_ACCENTS,
  PROJECT_CATEGORIES,
  emptyProject,
  uniqueSlug,
} from '@/admin/lib/content';
import { LIMITS, idIssues, validateProject, type Issue, type ValidationContext } from '@/admin/lib/validate';
import { ACCEPT_IMAGES, prepareUpload, slugify } from '@/admin/lib/images';
import type { Confirm, Focus, MediaApi } from '@/admin/types';
import { useItemEditor } from '@/admin/hooks/useItemEditor';
import { ImageThumb } from '@/admin/components/ImageThumb';
import {
  Badge,
  Drawer,
  EmptyState,
  IssueList,
  Modal,
  ReorderButtons,
  SectionHeader,
  SelectField,
  TagInput,
  TextAreaField,
  TextField,
  moveItem,
} from '@/admin/components/ui';

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

  return (
    <div>
      <SectionHeader
        title="Projects"
        description="Shown in the rotating carousel, in this order."
        actions={
          <button type="button" className="adm-btn-primary" onClick={addProject}>
            <Plus className="h-4 w-4" /> Add project
          </button>
        }
      />

      {listIssues.length > 0 && (
        <div className="mb-4">
          <IssueList messages={listIssues} />
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState title="No projects" description="The carousel needs at least one project." action={<button type="button" className="adm-btn-primary" onClick={addProject}><Plus className="h-4 w-4" /> Add project</button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p, i) => {
            const count = issues.filter((x) => x.index === i).length;
            return (
              <article key={`${p.id}-${i}`} className="adm-card flex flex-col overflow-hidden">
                <button type="button" onClick={() => editor.open(i, p)} className="block text-left">
                  <ImageThumb src={media.resolve(p.image)} fallback={p.image} alt={`${p.title} preview`} background={p.imageBg} className="aspect-[16/9] w-full border-b border-white/[0.06]" />
                </button>
                <div className="flex-1 p-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="accent">{p.category}</Badge>
                    {count > 0 && <Badge tone="danger">{count} issue{count > 1 ? 's' : ''}</Badge>}
                  </div>
                  <h3 className="mt-2 font-display text-base font-semibold text-ink-50">{p.title || 'Untitled project'}</h3>
                  {p.subtitle && <p className="text-xs text-ink-400">{p.subtitle}</p>}
                  <p className="mt-2 line-clamp-2 text-sm text-ink-400">{p.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {p.tech.slice(0, 4).map((t) => (
                      <span key={t} className="rounded-md bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-ink-300">{t}</span>
                    ))}
                    {p.tech.length > 4 && <span className="px-1 font-mono text-[10px] text-ink-500">+{p.tech.length - 4}</span>}
                  </div>
                  <div className="mt-3 flex gap-3 text-xs">
                    {p.links.github && (
                      <a href={p.links.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-400 hover:text-ink-100">
                        <Github className="h-3.5 w-3.5" /> Code
                      </a>
                    )}
                    {p.links.demo && (
                      <a href={p.links.demo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-400 hover:text-ink-100">
                        <ExternalLink className="h-3.5 w-3.5" /> Demo
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-white/[0.06] px-2 py-1.5">
                  <span className="px-2 font-mono text-[11px] text-ink-500">#{i + 1}</span>
                  <div className="flex items-center">
                    <ReorderButtons
                      index={i}
                      length={projects.length}
                      label={p.title || `project ${i + 1}`}
                      onMove={(from, to) => onChange(moveItem(projects, from, to))}
                      onDelete={projects.length > 1 ? () => remove(i) : undefined}
                    />
                    <button type="button" className="adm-icon-btn" onClick={() => editor.open(i, p)} aria-label={`Edit ${p.title}`}>
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

      <div className="grid gap-5 sm:grid-cols-2">
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
          className="font-mono"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Subtitle (optional)" value={value.subtitle ?? ''} onChange={(v) => set('subtitle', v)} error={errors.subtitle} max={LIMITS.short} />
        <SelectField
          label="Category"
          value={value.category}
          options={PROJECT_CATEGORIES.map((c) => ({ value: c, label: c }))}
          onChange={(v) => set('category', v)}
          error={errors.category}
        />
      </div>
      <TextField label="Summary" value={value.summary} onChange={(v) => set('summary', v)} error={errors.summary} max={LIMITS.summary} hint="One line shown above the title." />
      <TextAreaField label="Description" value={value.description} onChange={(v) => set('description', v)} error={errors.description} max={LIMITS.long} rows={5} />
      <TagInput label="Technologies" values={value.tech} onChange={(v) => set('tech', v)} error={errors.tech} placeholder="React, Django…" />

      <div>
        <div className="adm-label">
          <span>Project image</span>
          <span className="font-mono text-[10px] text-ink-500">1200 × 750 works best</span>
        </div>
        <ImageThumb
          src={value.image ? media.resolve(value.image) : ''}
          fallback={value.image}
          alt="Project preview"
          background={value.imageBg}
          className="aspect-[16/10] w-full rounded-xl border border-white/10"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <label className={`adm-btn-secondary cursor-pointer ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload new
            <input type="file" accept={ACCEPT_IMAGES} className="sr-only" onChange={(e) => void onFile(e)} />
          </label>
          <button type="button" className="adm-btn-secondary" onClick={() => setLibraryOpen(true)} disabled={media.items.length === 0}>
            <Images className="h-4 w-4" /> Choose existing
          </button>
        </div>
        {(uploadError || errors.image) && <p className="mt-2 text-xs text-rose-300">{uploadError ?? errors.image}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="GitHub link (optional)" type="url" value={value.links.github ?? ''} onChange={(v) => set('links', { ...value.links, github: v })} error={errors['links.github']} placeholder="https://github.com/…" />
        <TextField label="Live demo link (optional)" type="url" value={value.links.demo ?? ''} onChange={(v) => set('links', { ...value.links, demo: v })} error={errors['links.demo']} placeholder="https://…" />
      </div>

      <details className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3" open={!!(errors.imageBg || errors.image)}>
        <summary className="cursor-pointer select-none text-sm font-medium text-ink-200">Advanced</summary>
        <div className="mt-4 space-y-5">
          <TextField label="Image path or URL" value={value.image} onChange={(v) => set('image', v)} error={errors.image} hint="Set automatically when you upload or choose an image." className="font-mono" />
          <div className="flex items-end gap-3">
            <TextField
              label="Image background (optional)"
              value={value.imageBg ?? ''}
              onChange={(v) => set('imageBg', v)}
              error={errors.imageBg}
              placeholder="#0b0f1e"
              hint="Only for transparent images designed for a specific backdrop."
              className="flex-1"
            />
            <input type="color" value={hexBg} onChange={(e) => set('imageBg', e.target.value)} className="mb-6 h-10 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" aria-label="Pick image background colour" />
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
                className="overflow-hidden rounded-xl border border-white/10 text-left transition hover:border-accent-400/60"
              >
                <ImageThumb src={media.resolve(m.publicPath)} fallback={m.publicPath} alt={m.name} className="aspect-[16/10] w-full" />
                <span className="block truncate px-2 py-1.5 font-mono text-[10px] text-ink-400">{m.name}</span>
              </button>
            ))}
        </div>
      </Modal>
    </>
  );
}
