import { useState, type ChangeEvent } from 'react';
import { Check, Copy, Loader2, Trash2, Undo2, Upload } from 'lucide-react';
import { ACCEPT_IMAGES, formatBytes, prepareUpload } from '@/admin/lib/images';
import type { Confirm, MediaApi } from '@/admin/types';
import { ImageThumb } from '@/admin/components/ImageThumb';
import { Badge, EmptyState, SectionHeader } from '@/admin/components/ui';
import { cn } from '@/utils/cn';

export function MediaSection({ media, confirm }: { media: MediaApi; confirm: Confirm }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = '';
    if (!files.length) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of files) {
        const upload = await prepareUpload(file, file.name.replace(/\.[^.]+$/, ''));
        media.addUpload(upload, true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  const copy = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(path);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setError('Could not copy to the clipboard.');
    }
  };

  return (
    <div>
      <SectionHeader
        title="Media"
        description="Project images stored in public/assets/projects. Images a project still uses can't be deleted."
        actions={
          <label className={cn('adm-btn-primary cursor-pointer', uploading && 'pointer-events-none opacity-60')}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload images
            <input type="file" accept={ACCEPT_IMAGES} multiple className="sr-only" onChange={(e) => void onFile(e)} />
          </label>
        }
      />
      {error && <p className="mb-4 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {media.localMode && (
        <p className="mb-4 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          The repository image list is only available when signed in with GitHub.
        </p>
      )}

      {media.items.length === 0 ? (
        <EmptyState title="No images" description="Upload an image here, or from a project's editor." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.items.map((m) => (
            <article key={m.repoPath} className={cn('adm-card overflow-hidden', m.markedForDeletion && 'opacity-60')}>
              <ImageThumb src={media.resolve(m.publicPath)} fallback={m.publicPath} alt={m.name} className="aspect-[16/10] w-full border-b border-white/[0.06]" />
              <div className="space-y-2 p-3">
                <p className="truncate font-mono text-xs text-ink-200" title={m.name}>{m.name}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge>{formatBytes(m.size)}</Badge>
                  {m.pending && <Badge tone="success">New · unpublished</Badge>}
                  {m.markedForDeletion && <Badge tone="danger">Deleted on publish</Badge>}
                  {m.usedBy.length > 0 ? (
                    <Badge tone="accent">Used by {m.usedBy.join(', ')}</Badge>
                  ) : (
                    !m.markedForDeletion && <Badge tone="warn">Unused</Badge>
                  )}
                </div>
                <div className="flex justify-end gap-1 pt-1">
                  <button type="button" className="adm-icon-btn" onClick={() => void copy(m.publicPath)} aria-label="Copy path" title="Copy path">
                    {copied === m.publicPath ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                  </button>
                  {m.pending ? (
                    <button
                      type="button"
                      className="adm-icon-btn hover:!text-rose-300"
                      disabled={m.usedBy.length > 0}
                      title={m.usedBy.length ? 'In use by a project' : 'Remove upload'}
                      aria-label="Remove upload"
                      onClick={() => media.removeUpload(m.publicPath)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : m.markedForDeletion ? (
                    <button type="button" className="adm-icon-btn" onClick={() => media.toggleDeletion(m.repoPath)} aria-label="Undo delete" title="Undo delete">
                      <Undo2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="adm-icon-btn hover:!text-rose-300"
                      disabled={m.usedBy.length > 0}
                      title={m.usedBy.length ? 'In use by a project — change the project image first' : 'Delete image'}
                      aria-label="Delete image"
                      onClick={() =>
                        confirm({
                          title: `Delete ${m.name}?`,
                          message: 'The file is removed from the repository when you publish. You can undo this until then.',
                          confirmLabel: 'Mark for deletion',
                          danger: true,
                          onConfirm: () => media.toggleDeletion(m.repoPath),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
