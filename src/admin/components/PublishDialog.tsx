import { useEffect, useState } from 'react';
import { AlertTriangle, FileJson, ImagePlus, Loader2, Rocket, Trash2 } from 'lucide-react';
import type { ContentKey } from '@/admin/config';
import type { Issue } from '@/admin/lib/validate';
import { formatBytes, isPdfFileName, type PendingUpload } from '@/admin/lib/images';
import { Badge, IssueList, Modal } from '@/admin/components/ui';

const SECTION_LABELS: Record<ContentKey, string> = {
  profile: 'Profile',
  projects: 'Projects',
  skills: 'Skills',
  experience: 'Experience & education',
  about: 'About section',
  settings: 'Site settings',
};

export function PublishDialog({
  open,
  onClose,
  changedKeys,
  uploads,
  deletions,
  orphanedImages,
  issues,
  publishing,
  error,
  localMode,
  onPublish,
  onGoToIssue,
}: {
  open: boolean;
  onClose: () => void;
  changedKeys: ContentKey[];
  uploads: PendingUpload[];
  deletions: string[];
  orphanedImages: string[];
  issues: Issue[];
  publishing: boolean;
  error: string | null;
  localMode: boolean;
  onPublish: (message: string, extraDeletions: string[]) => void;
  onGoToIssue: (issue: Issue) => void;
}) {
  const [message, setMessage] = useState('');
  const [deleteOrphans, setDeleteOrphans] = useState(true);

  useEffect(() => {
    if (!open) return;
    const parts = changedKeys.map((k) => SECTION_LABELS[k].toLowerCase());
    if (uploads.length) parts.push('files');
    setMessage(`Update portfolio ${parts.join(', ') || 'media'} via admin panel`);
    setDeleteOrphans(true);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const blocked = issues.length > 0 || localMode || !message.trim();

  return (
    <Modal
      open={open}
      title="Review & publish"
      onClose={() => !publishing && onClose()}
      wide
      footer={
        <>
          <button type="button" className="adm-btn-secondary" onClick={onClose} disabled={publishing}>
            Keep editing
          </button>
          <button
            type="button"
            className="adm-btn-primary"
            disabled={blocked || publishing}
            onClick={() => onPublish(message.trim(), deleteOrphans ? orphanedImages : [])}
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {publishing ? 'Publishing…' : 'Publish to GitHub'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {localMode && (
          <p className="flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3.5 py-2.5 text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Local preview mode can't publish. Sign in with a GitHub token to publish.
          </p>
        )}

        {issues.length > 0 && (
          <div className="space-y-2.5">
            <IssueList messages={issues.map((i) => `${i.where}: ${i.message}`)} />
            <div className="flex flex-wrap gap-2">
              {[...new Map(issues.map((i) => [`${i.section}-${i.index ?? ''}`, i])).values()].map((i) => (
                <button key={`${i.section}-${i.index ?? ''}`} type="button" className="adm-btn-secondary adm-btn-sm" onClick={() => onGoToIssue(i)}>
                  Fix {i.where}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="adm-label">This commit will</p>
          <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
            {changedKeys.map((k) => (
              <li key={k} className="flex items-center gap-3 px-3.5 py-2.5">
                <span className="adm-icon-chip h-8 w-8 text-accent-300">
                  <FileJson className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink-100">Update {SECTION_LABELS[k]}</p>
                  <p className="truncate font-mono text-[11px] text-ink-500">src/content/{k}.json</p>
                </div>
              </li>
            ))}
            {uploads.map((u) => (
              <li key={u.repoPath} className="flex items-center gap-3 px-3.5 py-2.5">
                <span className="adm-icon-chip h-8 w-8 text-emerald-300">
                  <ImagePlus className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink-100">{isPdfFileName(u.repoPath) ? 'Add resume' : 'Add image'}</p>
                  <p className="truncate font-mono text-[11px] text-ink-500">{u.repoPath}</p>
                </div>
                <Badge>{formatBytes(u.size)}</Badge>
              </li>
            ))}
            {deletions.map((p) => (
              <li key={p} className="flex items-center gap-3 px-3.5 py-2.5">
                <span className="adm-icon-chip h-8 w-8 text-rose-300">
                  <Trash2 className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-ink-100">{isPdfFileName(p) ? 'Delete resume' : 'Delete image'}</p>
                  <p className="truncate font-mono text-[11px] text-ink-500">{p}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {orphanedImages.length > 0 && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition hover:border-white/[0.14]">
            <input
              type="checkbox"
              checked={deleteOrphans}
              onChange={(e) => setDeleteOrphans(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-accent-500"
            />
            <span>
              <span className="text-ink-200">
                Also delete {orphanedImages.length} image{orphanedImages.length > 1 ? 's' : ''} no project uses anymore
              </span>
              <span className="mt-1 block font-mono text-[11px] text-ink-500">{orphanedImages.join(', ')}</span>
            </span>
          </label>
        )}

        <div>
          <label htmlFor="commit-message" className="adm-label">
            Commit message
          </label>
          <input
            id="commit-message"
            className="adm-input"
            value={message}
            maxLength={200}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="adm-hint">
            Everything is saved as one commit. Vercel redeploys the site automatically, which usually takes a minute or two.
          </p>
        </div>

        {error && <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3.5 py-2.5 text-rose-200">{error}</p>}
      </div>
    </Modal>
  );
}
