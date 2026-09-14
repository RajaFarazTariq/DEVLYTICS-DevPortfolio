import { ArrowRight, Briefcase, FolderKanban, GraduationCap, Sparkles, UserRound } from 'lucide-react';
import type { ContentKey } from '@/admin/config';
import type { PortfolioContent } from '@/admin/lib/content';
import type { DeployStatus } from '@/admin/lib/github';
import type { Issue } from '@/admin/lib/validate';
import { Badge, SectionHeader } from '@/admin/components/ui';

type Target = 'profile' | 'projects' | 'skills' | 'experience' | 'media';

export function OverviewSection({
  draft,
  changedKeys,
  uploads,
  deletions,
  issues,
  mode,
  lastPublish,
  deploy,
  onNavigate,
}: {
  draft: PortfolioContent;
  changedKeys: ContentKey[];
  uploads: number;
  deletions: number;
  issues: Issue[];
  mode: 'github' | 'local';
  lastPublish: { sha: string; at: Date } | null;
  deploy: DeployStatus | null;
  onNavigate: (target: Target) => void;
}) {
  const skillCount = draft.skills.reduce((n, g) => n + g.items.length, 0);
  const work = draft.experience.filter((e) => e.type === 'work').length;
  const education = draft.experience.length - work;

  const cards: { label: string; value: number; sub: string; icon: typeof FolderKanban; target: Target }[] = [
    { label: 'Projects', value: draft.projects.length, sub: `${draft.projects.filter((p) => p.links.demo).length} with live demo`, icon: FolderKanban, target: 'projects' },
    { label: 'Skills', value: skillCount, sub: `in ${draft.skills.length} groups`, icon: Sparkles, target: 'skills' },
    { label: 'Experience', value: work, sub: 'work entries', icon: Briefcase, target: 'experience' },
    { label: 'Education', value: education, sub: 'education entries', icon: GraduationCap, target: 'experience' },
  ];

  const pending = changedKeys.length + uploads + deletions;

  return (
    <div>
      <SectionHeader
        title={`Welcome back${draft.profile.name ? `, ${draft.profile.name.split(' ')[0]}` : ''}`}
        description="Edit your portfolio content here. Changes stay as drafts until you review and publish them — publishing commits to GitHub and Vercel redeploys the site."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => onNavigate(c.target)}
            className="adm-card group p-5 text-left transition hover:border-white/15"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-400">{c.label}</span>
              <c.icon className="h-4 w-4 text-ink-500 transition group-hover:text-accent-300" />
            </div>
            <p className="mt-3 font-display text-3xl font-bold text-ink-50">{c.value}</p>
            <p className="mt-1 text-xs text-ink-500">{c.sub}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="adm-card p-5">
          <h2 className="font-display text-base font-semibold text-ink-50">Draft status</h2>
          {pending === 0 ? (
            <p className="mt-2 text-sm text-ink-400">Everything matches what is on GitHub.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm text-ink-300">
              {changedKeys.map((k) => (
                <li key={k} className="flex items-center justify-between">
                  <span className="capitalize">{k} edited</span>
                  <button type="button" className="text-xs text-accent-300 hover:underline" onClick={() => onNavigate(k)}>
                    Open
                  </button>
                </li>
              ))}
              {uploads > 0 && <li>{uploads} image upload{uploads > 1 ? 's' : ''} pending</li>}
              {deletions > 0 && <li>{deletions} image deletion{deletions > 1 ? 's' : ''} pending</li>}
            </ul>
          )}
          {issues.length > 0 && (
            <p className="mt-4">
              <Badge tone="danger">{issues.length} issue{issues.length > 1 ? 's' : ''} to fix before publishing</Badge>
            </p>
          )}
          {lastPublish && (
            <p className="mt-4 text-xs text-ink-500">
              Last published {lastPublish.at.toLocaleTimeString()} · commit{' '}
              <span className="font-mono">{lastPublish.sha.slice(0, 7)}</span>
              {deploy?.state === 'success' && ' · deployed'}
            </p>
          )}
          {mode === 'local' && (
            <p className="mt-4 text-xs text-amber-200">Local preview: edits can't be published from this mode.</p>
          )}
        </div>

        <div className="adm-card p-5">
          <h2 className="font-display text-base font-semibold text-ink-50">Profile at a glance</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Name</dt>
              <dd className="text-right text-ink-200">{draft.profile.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Tagline</dt>
              <dd className="text-right text-ink-200">{draft.profile.tagline}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Email</dt>
              <dd className="text-right text-ink-200">{draft.profile.email}</dd>
            </div>
          </dl>
          <button type="button" className="adm-btn-secondary mt-4 text-xs" onClick={() => onNavigate('profile')}>
            <UserRound className="h-3.5 w-3.5" /> Edit profile <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
