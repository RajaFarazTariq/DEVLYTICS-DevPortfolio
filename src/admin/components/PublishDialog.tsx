import { useEffect, useState } from 'react';
import { FileJson, ImagePlus, Loader2, Rocket, Trash2 } from 'lucide-react';
import type { ContentKey } from '@/admin/config';
import type { Issue } from '@/admin/lib/validate';
import { formatBytes, type PendingUpload } from '@/admin/lib/images';
import { Badge, IssueList, Modal } from '@/admin/components/ui';

const SECTION_LABELS: Record<ContentKey, string> = {
  profile: 'Profile',
  projects: 'Projects',
  skills: 'Skills',
  experience: 'Experience & education',
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
    if (uploads.length) parts.push('images');
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
          <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-amber-200">
            Local preview mode can't publish. Sign in with a GitHub token to publish.
          </p>
        )}

        {issues.length > 0 && (
          <div className="space-y-2">
            <IssueList messages={issues.map((i) => `${i.where}: ${i.message}`)} />
            <div className="flex flex-wrap gap-2">
              {[...new Map(issues.map((i) => [`${i.section}-${i.index ?? ''}`, i])).values()].map((i) => (
                <button key={`${i.section}-${i.index ?? ''}`} type="button" className="adm-btn-secondary px-2.5 py-1 text-xs" onClick={() => onGoToIssue(i)}>
                  Fix {i.where}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="adm-label">This commit will</p>
          <ul className="space-y-1.5">
            {changedKeys.map((k) => (
              <li key={k} className="flex items-center gap-2 text-ink-200">
                <FileJson className="h-4 w-4 text-accent-300" /> Update {SECTION_LABELS[k]}
                <span className="font-mono text-[11px] text-ink-500">src/content/{k}.json</span>
              </li>
            ))}
            {uploads.map((u) => (
              <li key={u.repoPath} className="flex items-center gap-2 text-ink-200">
                <ImagePlus className="h-4 w-4 text-emerald-300" /> Add image
                <span className="font-mono text-[11px] text-ink-500">{u.repoPath}</span>
                <Badge>{formatBytes(u.size)}</Badge>
              </li>
            ))}
            {deletions.map((p) => (
              <li key={p} className="flex items-center gap-2 text-ink-200">
                <Trash2 className="h-4 w-4 text-rose-300" /> Delete image
                <span className="font-mono text-[11px] text-ink-500">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {orphanedImages.length > 0 && (
          <label className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
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
          <p className="mt-1.5 text-xs text-ink-500">
            Everything is saved as one commit. Vercel redeploys the site automatically, which usually takes a minute or two.
          </p>
        </div>

        {error && <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-rose-200">{error}</p>}
      </div>
    </Modal>
  );
}
