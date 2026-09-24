import { useState, type ChangeEvent } from 'react';
import { CheckCircle2, Download, ExternalLink, FileText, Info, Loader2, Trash2, Undo2, Upload, XCircle } from 'lucide-react';
import { formatBytes, prepareResumeUpload } from '@/admin/lib/images';
import type { Issue } from '@/admin/lib/validate';
import type { Confirm, MediaApi, MediaItem } from '@/admin/types';
import { Badge, EmptyState, IssueList, SectionHeader, Toggle } from '@/admin/components/ui';
import { cn } from '@/utils/cn';

export function ResumeSection({
  active,
  onActiveChange,
  media,
  confirm,
  issues,
}: {
  active: string;
  onActiveChange: (publicPath: string) => void;
  media: MediaApi;
  confirm: Confirm;
  issues: Issue[];
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activate, setActivate] = useState(true);

  const current = media.resumes.find((r) => r.publicPath === active) ?? null;

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const upload = await prepareResumeUpload(file, file.name.replace(/\.[^.]+$/, ''));
      media.addUpload(upload, true);
      if (activate) onActiveChange(upload.publicPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  const remove = (r: MediaItem) => {
    if (r.pending) {
      media.removeUpload(r.publicPath);
      return;
    }
    confirm({
      title: `Delete ${r.name}?`,
      message: 'The file is removed from the repository when you publish. You can undo this until then.',
      confirmLabel: 'Mark for deletion',
      danger: true,
      onConfirm: () => media.toggleDeletion(r.repoPath),
    });
  };

  const uploadButton = (
    <label className={cn('adm-btn-primary cursor-pointer', uploading && 'pointer-events-none opacity-60')}>
      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      Upload PDF
      <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => void onFile(e)} />
    </label>
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Assets"
        title="Resume / CV"
        description="Upload your CV as a PDF and choose which one is live. While a resume is active, a “Download CV” button appears next to the hero buttons; with none active the site looks exactly as before."
        actions={uploadButton}
      />

      {issues.length > 0 && <IssueList messages={issues.map((i) => i.message)} />}
      {error && <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
      {media.localMode && (
        <p className="flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          The list of files already in the repository is only available when signed in with GitHub.
        </p>
      )}

      <section className="adm-section">
        <div className="adm-section-head">
          <div className="flex items-start gap-3">
            <span className={cn('adm-icon-chip', current ? 'text-emerald-300' : 'text-ink-500')}>
              {current ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            </span>
            <div>
              <h2 className="adm-section-title">Active resume</h2>
              <p className="adm-section-desc">{current ? 'Visitors download this file.' : 'No resume is shown on the site.'}</p>
            </div>
          </div>
          {current && (
            <button type="button" className="adm-btn-secondary adm-btn-sm" onClick={() => onActiveChange('')}>
              Remove from site
            </button>
          )}
        </div>
        <div className="adm-section-body">
          {current ? (
            <div className="flex flex-wrap items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-200">
                <FileText className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm text-ink-100">{current.name}</p>
                <p className="text-xs text-ink-400">
                  {formatBytes(current.size)} · {current.pending ? 'uploaded, not yet published' : `live at ${current.publicPath}`}
                </p>
              </div>
              <FileLinks item={current} media={media} />
            </div>
          ) : active ? (
            <p className="text-sm text-rose-200">The active resume {active} was not found. Choose another file below or remove it from the site.</p>
          ) : (
            <p className="text-sm text-ink-400">Upload a PDF, or set one of the files below as active.</p>
          )}
          <Toggle
            checked={activate}
            onChange={setActivate}
            label="Make new uploads the active resume"
            description="Replacing your CV is then one step: upload the new PDF and publish."
          />
        </div>
      </section>

      {media.resumes.length === 0 ? (
        <EmptyState icon={FileText} title="No resume files" description="Upload your CV as a PDF (max 10 MB)." action={uploadButton} />
      ) : (
        <div className="adm-card overflow-hidden">
          <div className="adm-table-head md:grid md:grid-cols-[minmax(0,1fr)_7rem_auto] md:gap-4">
            <span>File</span>
            <span>Size</span>
            <span className="text-right">Actions</span>
          </div>
          {media.resumes.map((r) => {
            const isActive = r.publicPath === active;
            return (
              <div key={r.repoPath} className={cn('adm-table-row grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_7rem_auto] md:gap-4', r.markedForDeletion && 'opacity-60')}>
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0 text-ink-400" />
                  <span className="truncate font-mono text-xs text-ink-100" title={r.name}>
                    {r.name}
                  </span>
                  {isActive && <Badge tone="success">Active</Badge>}
                  {r.pending && <Badge tone="accent">New · unpublished</Badge>}
                  {r.markedForDeletion && <Badge tone="danger">Deleted on publish</Badge>}
                </div>
                <span className="font-mono text-[11px] text-ink-500">{formatBytes(r.size)}</span>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  {!isActive && !r.markedForDeletion && (
                    <button type="button" className="adm-btn-secondary adm-btn-sm" onClick={() => onActiveChange(r.publicPath)}>
                      Set active
                    </button>
                  )}
                  <FileLinks item={r} media={media} compact />
                  {r.markedForDeletion ? (
                    <button type="button" className="adm-icon-btn" onClick={() => media.toggleDeletion(r.repoPath)} aria-label="Undo delete" title="Undo delete">
                      <Undo2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="adm-icon-btn hover:!bg-rose-500/10 hover:!text-rose-300"
                      disabled={isActive}
                      title={isActive ? 'This is the active resume — remove it from the site or activate another first' : 'Delete'}
                      aria-label={`Delete ${r.name}`}
                      onClick={() => remove(r)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FileLinks({ item, media, compact }: { item: MediaItem; media: MediaApi; compact?: boolean }) {
  const url = media.openUrl(item);
  return (
    <>
      {!item.pending && (
        <a href={url} target="_blank" rel="noreferrer" className="adm-btn-ghost adm-btn-sm" title="Open">
          <ExternalLink className="h-3.5 w-3.5" /> {compact ? '' : 'View'}
        </a>
      )}
      <a href={item.pending ? url : item.publicPath} download={item.name} className="adm-btn-ghost adm-btn-sm" title={item.pending ? 'Download' : 'Download from the live site'}>
        <Download className="h-3.5 w-3.5" /> {compact ? '' : 'Download'}
      </a>
    </>
  );
}
