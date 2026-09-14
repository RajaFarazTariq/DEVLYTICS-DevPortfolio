import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  FileJson,
  FolderKanban,
  GraduationCap,
  ImagePlus,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import type { ContentKey } from '@/admin/config';
import type { PortfolioContent } from '@/admin/lib/content';
import type { DeployStatus } from '@/admin/lib/github';
import type { Issue } from '@/admin/lib/validate';
import { Badge, SectionHeader } from '@/admin/components/ui';
import { cn } from '@/utils/cn';

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

  const cards: { label: string; value: number; sub: string; icon: typeof FolderKanban; target: Target; tone: string }[] = [
    { label: 'Projects', value: draft.projects.length, sub: `${draft.projects.filter((p) => p.links.demo).length} with live demo`, icon: FolderKanban, target: 'projects', tone: 'border-accent-400/20 bg-accent-500/10 text-accent-300' },
    { label: 'Skills', value: skillCount, sub: `in ${draft.skills.length} groups`, icon: Sparkles, target: 'skills', tone: 'border-violet-400/20 bg-violet-500/10 text-violet-300' },
    { label: 'Experience', value: work, sub: 'work entries', icon: Briefcase, target: 'experience', tone: 'border-cyan-400/20 bg-cyan-500/10 text-cyan-300' },
    { label: 'Education', value: education, sub: 'education entries', icon: GraduationCap, target: 'experience', tone: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' },
  ];

  const pending = changedKeys.length + uploads + deletions;

  return (
    <div>
      <SectionHeader
        eyebrow="Dashboard"
        title={`Welcome back${draft.profile.name ? `, ${draft.profile.name.split(' ')[0]}` : ''}`}
        description="Edit your portfolio content here. Changes stay as drafts until you review and publish them — publishing commits to GitHub and Vercel redeploys the site."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {cards.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => onNavigate(c.target)}
            className="adm-card adm-card-interactive group p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/40 sm:p-5"
          >
            <div className="flex items-start justify-between">
              <span className={cn('grid h-10 w-10 place-items-center rounded-xl border', c.tone)}>
                <c.icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-ink-600 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink-200" />
            </div>
            <p className="mt-5 font-display text-3xl font-bold tabular-nums text-ink-50">{c.value}</p>
            <p className="mt-1 text-sm font-medium text-ink-200">{c.label}</p>
            <p className="text-xs text-ink-400">{c.sub}</p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5 lg:items-start">
        <section className="adm-section lg:col-span-3">
          <div className="adm-section-head">
            <div>
              <h2 className="adm-section-title">Draft status</h2>
              <p className="adm-section-desc">What will be committed when you publish.</p>
            </div>
            {pending === 0 ? <Badge tone="success">Up to date</Badge> : <Badge tone="warn">{pending} pending</Badge>}
          </div>
          <div className="px-5 sm:px-6">
            {pending === 0 ? (
              <div className="flex items-center gap-3 py-6 text-sm text-ink-300">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                Everything matches what is on GitHub.
              </div>
            ) : (
              <ul className="divide-y divide-white/[0.05]">
                {changedKeys.map((k) => (
                  <li key={k} className="flex items-center gap-3 py-3 text-sm">
                    <span className="adm-icon-chip h-8 w-8 text-accent-300">
                      <FileJson className="h-4 w-4" />
                    </span>
                    <span className="flex-1 capitalize text-ink-200">{k} edited</span>
                    <button type="button" className="adm-btn-ghost adm-btn-sm" onClick={() => onNavigate(k)}>
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
                {uploads > 0 && (
                  <li className="flex items-center gap-3 py-3 text-sm text-ink-200">
                    <span className="adm-icon-chip h-8 w-8 text-emerald-300">
                      <ImagePlus className="h-4 w-4" />
                    </span>
                    {uploads} image upload{uploads > 1 ? 's' : ''} pending
                  </li>
                )}
                {deletions > 0 && (
                  <li className="flex items-center gap-3 py-3 text-sm text-ink-200">
                    <span className="adm-icon-chip h-8 w-8 text-rose-300">
                      <Trash2 className="h-4 w-4" />
                    </span>
                    {deletions} image deletion{deletions > 1 ? 's' : ''} pending
                  </li>
                )}
              </ul>
            )}
          </div>
          {(issues.length > 0 || lastPublish || mode === 'local') && (
            <div className="space-y-2 border-t border-white/[0.06] bg-white/[0.015] px-5 py-3.5 sm:px-6">
              {issues.length > 0 && <Badge tone="danger">{issues.length} issue{issues.length > 1 ? 's' : ''} to fix before publishing</Badge>}
              {lastPublish && (
                <p className="text-xs text-ink-400">
                  Last published {lastPublish.at.toLocaleTimeString()} · commit <span className="font-mono">{lastPublish.sha.slice(0, 7)}</span>
                  {deploy?.state === 'success' && ' · deployed'}
                </p>
              )}
              {mode === 'local' && <p className="text-xs text-amber-200">Local preview: edits can't be published from this mode.</p>}
            </div>
          )}
        </section>

        <section className="adm-section lg:col-span-2">
          <div className="adm-section-head">
            <div>
              <h2 className="adm-section-title">Profile at a glance</h2>
              <p className="adm-section-desc">Shown in the hero, footer and contact section.</p>
            </div>
          </div>
          <dl className="divide-y divide-white/[0.05] px-5 text-sm sm:px-6">
            {[
              ['Name', draft.profile.name],
              ['Tagline', draft.profile.tagline],
              ['Email', draft.profile.email],
              ['Location', draft.profile.location],
            ].map(([term, value]) => (
              <div key={term} className="flex justify-between gap-4 py-3">
                <dt className="shrink-0 text-ink-400">{term}</dt>
                <dd className="min-w-0 truncate text-right text-ink-100" title={value}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-white/[0.06] px-5 py-3.5 sm:px-6">
            <button type="button" className="adm-btn-secondary adm-btn-sm" onClick={() => onNavigate('profile')}>
              <UserRound className="h-3.5 w-3.5" /> Edit profile <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
