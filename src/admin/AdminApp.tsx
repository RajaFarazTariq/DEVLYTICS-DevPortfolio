import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderKanban,
  Github,
  Images,
  LayoutDashboard,
  Loader2,
  LogOut,
  RefreshCw,
  Rocket,
  RotateCcw,
  Sparkles,
  UserRound,
  XCircle,
} from 'lucide-react';
import { ADMIN_CONFIG, CONTENT_FILES, CONTENT_KEYS, repoUrl, type ContentKey } from '@/admin/config';
import {
  ConflictError,
  GitHubError,
  createGitHubClient,
  describeGitHubError,
  type DeployStatus,
  type DirEntry,
  type FileChange,
  type GitHubClient,
  type GitHubUser,
} from '@/admin/lib/github';
import { clearToken, loadToken, saveToken } from '@/admin/lib/session';
import { parseSection, serializeSection, type PortfolioContent } from '@/admin/lib/content';
import { validateSection, type Issue, type ValidationContext } from '@/admin/lib/validate';
import {
  isImageFileName,
  publicPathToRepoPath,
  rawImageUrl,
  repoPathToPublicPath,
  type PendingUpload,
} from '@/admin/lib/images';
import type { Focus, MediaApi, MediaItem } from '@/admin/types';
import { ConfirmDialog, type ConfirmRequest } from '@/admin/components/ui';
import { LoginScreen } from '@/admin/components/LoginScreen';
import { PublishDialog } from '@/admin/components/PublishDialog';
import { OverviewSection } from '@/admin/sections/OverviewSection';
import { ProfileSection } from '@/admin/sections/ProfileSection';
import { ProjectsSection } from '@/admin/sections/ProjectsSection';
import { SkillsSection } from '@/admin/sections/SkillsSection';
import { ExperienceSection } from '@/admin/sections/ExperienceSection';
import { MediaSection } from '@/admin/sections/MediaSection';
import { cn } from '@/utils/cn';

type LoadedFile = { sha: string; text: string };

type Loaded = {
  mode: 'github' | 'local';
  headSha: string;
  files: Record<ContentKey, LoadedFile>;
  /** Canonical serialisation of what was loaded — the reference for "changed". */
  baseline: Record<ContentKey, string>;
  original: PortfolioContent;
  images: DirEntry[];
};

type Upload = PendingUpload & { keep: boolean };

type Phase = 'signed-out' | 'verifying' | 'loading' | 'ready' | 'error';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'skills', label: 'Skills', icon: Sparkles },
  { id: 'experience', label: 'Experience & Education', icon: Briefcase },
  { id: 'media', label: 'Media', icon: Images },
] as const;

type Tab = (typeof TABS)[number]['id'];

const cleanPath = (p: string) => p.split(/[?#]/)[0];

function readTab(): Tab {
  const hash = window.location.hash.slice(1);
  return TABS.some((t) => t.id === hash) ? (hash as Tab) : 'overview';
}

function buildLoaded(
  mode: Loaded['mode'],
  headSha: string,
  files: Record<ContentKey, LoadedFile>,
  images: DirEntry[],
): Loaded {
  const original = {} as Record<ContentKey, unknown>;
  const baseline = {} as Record<ContentKey, string>;
  for (const key of CONTENT_KEYS) {
    original[key] = parseSection(key, files[key].text);
    try {
      baseline[key] = serializeSection(key, original[key] as never);
    } catch {
      throw new Error(`${CONTENT_FILES[key]} has entries with missing fields. Fix the file in the repository before editing.`);
    }
  }
  return { mode, headSha, files, baseline, original: original as PortfolioContent, images };
}

export function AdminApp() {
  const [token, setToken] = useState<string | null>(() => loadToken());
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [phase, setPhase] = useState<Phase>(token ? 'verifying' : 'signed-out');
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [draft, setDraft] = useState<PortfolioContent | null>(null);
  const [uploads, setUploads] = useState<Record<string, Upload>>({});
  const [deletions, setDeletions] = useState<string[]>([]);
  const [previewCache, setPreviewCache] = useState<Record<string, string>>({});

  const [tab, setTabState] = useState<Tab>(readTab);
  const [focus, setFocus] = useState<{ section: ContentKey; index?: number; nonce: number } | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [lastPublish, setLastPublish] = useState<{ sha: string; at: Date } | null>(null);
  const [deploy, setDeploy] = useState<DeployStatus | null>(null);
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const client = useMemo(() => (token ? createGitHubClient(token) : null), [token]);
  const loadedRef = useRef(loaded);
  loadedRef.current = loaded;

  const setTab = useCallback((next: Tab) => {
    window.history.replaceState(null, '', `#${next}`);
    setTabState(next);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    const onHash = () => setTabState(readTab());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(t);
  }, [toast]);

  // ── Loading ────────────────────────────────────────────────────────────────

  const applyLoaded = useCallback((next: Loaded) => {
    setLoaded(next);
    setDraft(structuredClone(next.original));
    setUploads({});
    setDeletions([]);
  }, []);

  const loadFromGitHub = useCallback(
    async (c: GitHubClient, { quiet = false } = {}) => {
      if (!quiet) {
        setPhase('loading');
        setLoadError(null);
      }
      try {
        const headSha = await c.getHeadSha();
        const files = {} as Record<ContentKey, LoadedFile>;
        await Promise.all(
          CONTENT_KEYS.map(async (key) => {
            try {
              const file = await c.getFile(CONTENT_FILES[key], headSha);
              files[key] = { sha: file.sha, text: file.text };
            } catch (err) {
              if (err instanceof GitHubError && err.status === 404) {
                throw new Error(
                  `${CONTENT_FILES[key]} is not on the "${ADMIN_CONFIG.branch}" branch yet. Commit and push the admin panel changes first — the admin edits these files.`,
                );
              }
              throw err;
            }
          }),
        );
        const images = await c.listDir(ADMIN_CONFIG.imageDir, headSha);
        applyLoaded(buildLoaded('github', headSha, files, images));
        setPhase('ready');
      } catch (err) {
        if (quiet) {
          setToast({ tone: 'error', text: `Published, but refreshing failed: ${describeGitHubError(err)} Reload before editing again.` });
          return;
        }
        setLoadError(describeGitHubError(err));
        setPhase('error');
      }
    },
    [applyLoaded],
  );

  // Verify the token (on first load, after sign-in, or after idle sign-out).
  useEffect(() => {
    if (!client) return;
    let cancelled = false;
    setPhase('verifying');
    client
      .verifyAccess()
      .then((u) => {
        if (cancelled) return;
        setUser(u);
        setAuthError(null);
        setExpired(false);
        if (loadedRef.current?.mode === 'github') setPhase('ready');
        else void loadFromGitHub(client);
      })
      .catch((err) => {
        if (cancelled) return;
        clearToken();
        setToken(null);
        setUser(null);
        setAuthError(describeGitHubError(err));
        setPhase('signed-out');
      });
    return () => {
      cancelled = true;
    };
  }, [client, loadFromGitHub]);

  const signIn = (value: string) => {
    saveToken(value);
    setAuthError(null);
    setToken(value);
  };

  const startLocalPreview = import.meta.env.DEV
    ? async () => {
        setPhase('loading');
        try {
          const mods = {
            profile: await import('@/content/profile.json'),
            projects: await import('@/content/projects.json'),
            skills: await import('@/content/skills.json'),
            experience: await import('@/content/experience.json'),
          };
          const files = {} as Record<ContentKey, LoadedFile>;
          for (const key of CONTENT_KEYS) {
            files[key] = { sha: 'local', text: JSON.stringify(mods[key].default, null, 2) + '\n' };
          }
          setExpired(false);
          applyLoaded(buildLoaded('local', 'local', files, []));
          setPhase('ready');
        } catch (err) {
          setLoadError(describeGitHubError(err));
          setPhase('error');
        }
      }
    : undefined;

  // ── Derived state ──────────────────────────────────────────────────────────

  const serialized = useMemo(() => {
    if (!draft) return null;
    const out = {} as Record<ContentKey, string>;
    for (const key of CONTENT_KEYS) {
      try {
        out[key] = serializeSection(key, draft[key] as never);
      } catch {
        out[key] = '';
      }
    }
    return out;
  }, [draft]);

  const changedKeys = useMemo(
    () => (loaded && serialized ? CONTENT_KEYS.filter((k) => serialized[k] !== loaded.baseline[k]) : []),
    [loaded, serialized],
  );

  const referencedImages = useMemo(
    () => new Set((draft?.projects ?? []).map((p) => cleanPath(p.image))),
    [draft],
  );

  const uploadsToCommit = useMemo(
    () => Object.values(uploads).filter((u) => u.keep || referencedImages.has(u.publicPath)),
    [uploads, referencedImages],
  );

  const dirty = changedKeys.length > 0 || uploadsToCommit.length > 0 || deletions.length > 0;

  const ctx = useMemo<ValidationContext>(
    () => ({
      imageExists: (publicPath) => {
        const clean = cleanPath(publicPath);
        if (!clean.startsWith(ADMIN_CONFIG.imagePublicPrefix)) return true;
        const repoPath = publicPathToRepoPath(clean);
        if (!repoPath) return false;
        if (!loaded || loaded.mode === 'local') return true;
        if (uploads[clean]) return true;
        return loaded.images.some((e) => e.path === repoPath) && !deletions.includes(repoPath);
      },
    }),
    [loaded, uploads, deletions],
  );

  const issues = useMemo<Issue[]>(
    () => (draft ? CONTENT_KEYS.flatMap((k) => validateSection(k, draft, ctx)) : []),
    [draft, ctx],
  );

  const orphanedImages = useMemo(() => {
    if (!loaded || !draft) return [];
    const before = new Set(loaded.original.projects.map((p) => cleanPath(p.image)));
    return [...before]
      .filter((p) => !referencedImages.has(p))
      .map((p) => publicPathToRepoPath(p))
      .filter((p): p is string => !!p && loaded.images.some((e) => e.path === p) && !deletions.includes(p));
  }, [loaded, draft, referencedImages, deletions]);

  const mediaItems = useMemo<MediaItem[]>(() => {
    const usedBy = (publicPath: string) =>
      (draft?.projects ?? []).filter((p) => cleanPath(p.image) === publicPath).map((p) => p.title || p.id);
    const pending = uploadsToCommit.map((u) => ({
      publicPath: u.publicPath,
      repoPath: u.repoPath,
      name: u.repoPath.split('/').pop() ?? u.repoPath,
      size: u.size,
      pending: true,
      markedForDeletion: false,
      usedBy: usedBy(u.publicPath),
    }));
    const existing = (loaded?.images ?? [])
      .filter((e) => e.type === 'file' && isImageFileName(e.name))
      .map((e) => {
        const publicPath = repoPathToPublicPath(e.path);
        return {
          publicPath,
          repoPath: e.path,
          name: e.name,
          size: e.size,
          pending: false,
          markedForDeletion: deletions.includes(e.path),
          usedBy: usedBy(publicPath),
        };
      });
    return [...pending, ...existing];
  }, [loaded, draft, uploadsToCommit, deletions]);

  const media: MediaApi = {
    items: mediaItems,
    localMode: loaded?.mode === 'local',
    resolve: (publicPath) => {
      const clean = cleanPath(publicPath);
      if (uploads[clean]) return uploads[clean].previewUrl;
      if (previewCache[clean]) return previewCache[clean];
      if (/^https?:\/\//i.test(publicPath) || loaded?.mode === 'local') return publicPath;
      return rawImageUrl(publicPath);
    },
    addUpload: (upload, keepInLibrary = false) =>
      setUploads((u) => ({ ...u, [upload.publicPath]: { ...upload, keep: keepInLibrary } })),
    removeUpload: (publicPath) =>
      setUploads((u) => {
        const next = { ...u };
        delete next[publicPath];
        return next;
      }),
    toggleDeletion: (repoPath) =>
      setDeletions((d) => (d.includes(repoPath) ? d.filter((p) => p !== repoPath) : [...d, repoPath])),
  };

  // ── Guards: unsaved changes + idle timeout ─────────────────────────────────

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (phase !== 'ready' || !token) return;
    let last = Date.now();
    const bump = () => {
      last = Date.now();
    };
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - last < ADMIN_CONFIG.idleTimeoutMs || publishing) return;
      clearToken();
      setToken(null);
      setUser(null);
      setExpired(true);
      setPublishOpen(false);
      setPhase('signed-out');
    }, 15_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      window.clearInterval(timer);
    };
  }, [phase, token, publishing]);

  // ── Deploy status after publishing ─────────────────────────────────────────

  useEffect(() => {
    if (!client || !lastPublish) return;
    let stopped = false;
    let timer = 0;
    const started = Date.now();
    setDeploy({ state: 'waiting' });
    const tick = async () => {
      try {
        const status = await client.getDeployStatus(lastPublish.sha);
        if (stopped) return;
        setDeploy(status);
        if (status.state === 'success' || status.state === 'failure' || status.state === 'error') return;
      } catch {
        if (!stopped) setDeploy({ state: 'unknown' });
        return;
      }
      if (Date.now() - started < 10 * 60_000) timer = window.setTimeout(tick, 8000);
    };
    void tick();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [client, lastPublish]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const update = useCallback(<K extends ContentKey>(key: K, value: PortfolioContent[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }, []);

  const discardAll = () =>
    setConfirmRequest({
      title: 'Discard all unpublished changes?',
      message: 'Every edit, upload and pending deletion since the last load will be lost.',
      confirmLabel: 'Discard changes',
      danger: true,
      onConfirm: () => loaded && applyLoaded(loaded),
    });

  const reloadLatest = () => {
    if (!client) return;
    const run = () => {
      setPublishOpen(false);
      setConflict(false);
      setPublishError(null);
      void loadFromGitHub(client);
    };
    if (!dirty) return run();
    setConfirmRequest({
      title: 'Reload from GitHub?',
      message: 'Your unpublished changes will be discarded and the latest content loaded.',
      confirmLabel: 'Reload',
      danger: true,
      onConfirm: run,
    });
  };

  const signOut = () => {
    const run = () => {
      clearToken();
      setToken(null);
      setUser(null);
      setLoaded(null);
      setDraft(null);
      setUploads({});
      setDeletions([]);
      setExpired(false);
      setLastPublish(null);
      setDeploy(null);
      setPhase('signed-out');
    };
    if (!dirty) return run();
    setConfirmRequest({
      title: 'Sign out and discard changes?',
      message: 'You have unpublished changes. Signing out discards them.',
      confirmLabel: 'Sign out',
      danger: true,
      onConfirm: run,
    });
  };

  const openPublish = () => {
    setPublishError(null);
    setConflict(false);
    setPublishOpen(true);
  };

  const publish = async (message: string, extraDeletions: string[]) => {
    if (!client || !loaded || !draft || !serialized || loaded.mode !== 'github') return;
    setPublishing(true);
    setPublishError(null);
    setConflict(false);
    try {
      // Guard 1: nobody changed the content files since they were loaded.
      const head = await client.getHeadSha();
      if (head !== loaded.headSha) {
        const conflicts: string[] = [];
        await Promise.all(
          CONTENT_KEYS.map(async (key) => {
            try {
              const file = await client.getFile(CONTENT_FILES[key], head);
              if (file.sha !== loaded.files[key].sha) conflicts.push(CONTENT_FILES[key]);
            } catch (err) {
              if (err instanceof GitHubError && err.status === 404) conflicts.push(CONTENT_FILES[key]);
              else throw err;
            }
          }),
        );
        if (conflicts.length) throw new ConflictError(conflicts);
      }

      // Guard 2: never delete an image a project still points at, or one that is already gone.
      const allDeletions = [...new Set([...deletions, ...extraDeletions])];
      const stillUsed = allDeletions.filter((p) => referencedImages.has(repoPathToPublicPath(p)));
      if (stillUsed.length) {
        throw new Error(`These images are still used by a project and can't be deleted: ${stillUsed.join(', ')}`);
      }
      const headImages = head === loaded.headSha ? loaded.images : await client.listDir(ADMIN_CONFIG.imageDir, head);
      const safeDeletions = allDeletions.filter((p) => headImages.some((e) => e.path === p));

      // Guard 3: re-validate right before writing.
      if (issues.length) throw new Error('Fix the listed issues before publishing.');

      const changes: FileChange[] = [
        ...changedKeys.map((key) => ({ path: CONTENT_FILES[key], text: serialized[key] })),
        ...uploadsToCommit.map((u) => ({ path: u.repoPath, base64: u.base64 })),
      ];
      if (!changes.length && !safeDeletions.length) throw new Error('There is nothing to publish.');

      // Guard 4: single atomic commit, non-forced branch update (see github.ts).
      const sha = await client.commit({ parentSha: head, message, changes, deletions: safeDeletions });

      setPreviewCache((c) => ({
        ...c,
        ...Object.fromEntries(uploadsToCommit.map((u) => [u.publicPath, u.previewUrl])),
      }));
      setLastPublish({ sha, at: new Date() });
      setPublishOpen(false);
      setToast({ tone: 'success', text: 'Published. Vercel is redeploying your portfolio.' });
      await loadFromGitHub(client, { quiet: true });
    } catch (err) {
      setConflict(err instanceof ConflictError);
      setPublishError(describeGitHubError(err));
    } finally {
      setPublishing(false);
    }
  };

  const goToIssue = (issue: Issue) => {
    setPublishOpen(false);
    setTab(issue.section);
    setFocus({ section: issue.section, index: issue.index, nonce: Date.now() });
  };

  const focusFor = (section: ContentKey): Focus =>
    focus && focus.section === section ? { index: focus.index, nonce: focus.nonce } : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (phase === 'signed-out' || phase === 'verifying') {
    return (
      <LoginScreen
        busy={phase === 'verifying'}
        error={authError}
        expired={expired}
        hasUnsavedChanges={dirty}
        onSubmit={signIn}
        onLocalPreview={startLocalPreview}
      />
    );
  }

  if (phase === 'loading' || !draft || !loaded) {
    if (phase === 'error') {
      return (
        <CenteredCard>
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-300" />
          <h1 className="mt-3 font-display text-lg font-semibold text-ink-50">Couldn't load portfolio content</h1>
          <p className="mt-2 text-sm text-ink-400">{loadError}</p>
          <div className="mt-6 flex justify-center gap-2">
            {client && (
              <button type="button" className="adm-btn-primary" onClick={() => void loadFromGitHub(client)}>
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
            )}
            <button type="button" className="adm-btn-secondary" onClick={signOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </CenteredCard>
      );
    }
    return (
      <CenteredCard>
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-accent-300" />
        <p className="mt-3 text-sm text-ink-300">Loading portfolio content…</p>
      </CenteredCard>
    );
  }

  const sectionState = (id: Tab) => {
    if (id === 'overview') return { changed: false, issues: 0 };
    if (id === 'media') return { changed: uploadsToCommit.length > 0 || deletions.length > 0, issues: 0 };
    return { changed: changedKeys.includes(id), issues: issues.filter((i) => i.section === id).length };
  };

  const nav = TABS.map((t) => {
    const s = sectionState(t.id);
    const Icon = t.icon;
    return (
      <button
        key={t.id}
        type="button"
        onClick={() => setTab(t.id)}
        className={cn(
          'flex shrink-0 items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition',
          tab === t.id ? 'bg-white/[0.08] text-ink-50' : 'text-ink-400 hover:bg-white/[0.04] hover:text-ink-100',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 whitespace-nowrap">{t.label}</span>
        {s.issues > 0 && (
          <span className="rounded-full bg-rose-500/20 px-1.5 text-[10px] font-semibold text-rose-200">{s.issues}</span>
        )}
        {s.changed && <span className="h-2 w-2 rounded-full bg-amber-400" title="Unpublished changes" />}
      </button>
    );
  });

  const changeCount = changedKeys.length + uploadsToCommit.length + deletions.length;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-white/[0.06] bg-ink-900/40 lg:flex lg:h-screen lg:flex-col lg:sticky lg:top-0">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-violet-600 font-display font-bold text-white shadow-glow">
            D
          </span>
          <div className="leading-tight">
            <p className="font-display font-bold text-ink-50">Devlytics</p>
            <p className="text-xs text-ink-500">Admin panel</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">{nav}</nav>
        <div className="space-y-3 border-t border-white/[0.06] p-4">
          <a href="/" target="_blank" rel="noreferrer" className="adm-btn-ghost w-full justify-start px-2 text-xs">
            <ExternalLink className="h-3.5 w-3.5" /> View live site
          </a>
          <div className="flex items-center gap-3">
            {user ? (
              <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full border border-white/10" />
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/[0.06] text-xs text-ink-400">L</span>
            )}
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm text-ink-100">{user ? user.name || user.login : 'Local preview'}</p>
              <p className="truncate text-xs text-ink-500">{user ? `@${user.login}` : 'Not signed in'}</p>
            </div>
            <button type="button" className="adm-icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
            <div className="flex items-center gap-2 text-xs text-ink-400">
              {loaded.mode === 'local' ? (
                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-amber-200">
                  Local preview · publishing disabled
                </span>
              ) : (
                <a
                  href={`${repoUrl}/tree/${ADMIN_CONFIG.branch}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 hover:text-ink-100"
                >
                  <Github className="h-3.5 w-3.5" /> {ADMIN_CONFIG.repo}@{ADMIN_CONFIG.branch}
                  <span className="font-mono text-ink-500">{loaded.headSha.slice(0, 7)}</span>
                </a>
              )}
              {deploy && <DeployPill status={deploy} />}
            </div>
            <div className="ml-auto flex items-center gap-2">
              {dirty && (
                <span className="hidden text-xs text-amber-200 sm:inline">
                  {changeCount} unpublished change{changeCount === 1 ? '' : 's'}
                </span>
              )}
              <button type="button" className="adm-btn-ghost" onClick={discardAll} disabled={!dirty}>
                <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">Discard</span>
              </button>
              <button type="button" className="adm-btn-primary" onClick={openPublish} disabled={!dirty}>
                <Rocket className="h-4 w-4" /> Review & publish
              </button>
              <button type="button" className="adm-icon-btn lg:hidden" onClick={signOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <nav className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">{nav}</nav>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          {tab === 'overview' && (
            <OverviewSection
              draft={draft}
              changedKeys={changedKeys}
              uploads={uploadsToCommit.length}
              deletions={deletions.length}
              issues={issues}
              mode={loaded.mode}
              lastPublish={lastPublish}
              deploy={deploy}
              onNavigate={(t) => setTab(t)}
            />
          )}
          {tab === 'profile' && (
            <ProfileSection
              profile={draft.profile}
              onChange={(v) => update('profile', v)}
              issues={issues.filter((i) => i.section === 'profile')}
            />
          )}
          {tab === 'projects' && (
            <ProjectsSection
              projects={draft.projects}
              onChange={(v) => update('projects', v)}
              issues={issues.filter((i) => i.section === 'projects')}
              ctx={ctx}
              media={media}
              confirm={setConfirmRequest}
              focus={focusFor('projects')}
            />
          )}
          {tab === 'skills' && (
            <SkillsSection
              groups={draft.skills}
              onChange={(v) => update('skills', v)}
              issues={issues.filter((i) => i.section === 'skills')}
              confirm={setConfirmRequest}
              focus={focusFor('skills')}
            />
          )}
          {tab === 'experience' && (
            <ExperienceSection
              items={draft.experience}
              onChange={(v) => update('experience', v)}
              issues={issues.filter((i) => i.section === 'experience')}
              confirm={setConfirmRequest}
              focus={focusFor('experience')}
            />
          )}
          {tab === 'media' && <MediaSection media={media} confirm={setConfirmRequest} />}
        </main>
      </div>

      <PublishDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        changedKeys={changedKeys}
        uploads={uploadsToCommit}
        deletions={deletions}
        orphanedImages={orphanedImages}
        issues={issues}
        publishing={publishing}
        error={publishError}
        localMode={loaded.mode === 'local'}
        onPublish={(message, extra) => void publish(message, extra)}
        onGoToIssue={goToIssue}
      />
      {conflict && publishOpen && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
          <button type="button" className="adm-btn-primary shadow-2xl" onClick={reloadLatest}>
            <RefreshCw className="h-4 w-4" /> Reload latest from GitHub
          </button>
        </div>
      )}

      <ConfirmDialog request={confirmRequest} onClose={() => setConfirmRequest(null)} />

      {toast && (
        <div
          role="status"
          className={cn(
            'fixed bottom-6 right-6 z-[70] max-w-sm rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur',
            toast.tone === 'success'
              ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-100'
              : 'border-rose-400/30 bg-rose-500/15 text-rose-100',
          )}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

function CenteredCard({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="adm-card w-full max-w-md p-8 text-center">{children}</div>
    </div>
  );
}

export function DeployPill({ status }: { status: DeployStatus }) {
  const map = {
    waiting: { icon: Clock, label: 'Waiting for Vercel', tone: 'text-ink-300 border-white/10' },
    queued: { icon: Loader2, label: 'Deploy queued', tone: 'text-accent-200 border-accent-400/30' },
    in_progress: { icon: Loader2, label: 'Deploying…', tone: 'text-accent-200 border-accent-400/30' },
    success: { icon: CheckCircle2, label: 'Live', tone: 'text-emerald-200 border-emerald-400/30' },
    failure: { icon: XCircle, label: 'Deploy failed', tone: 'text-rose-200 border-rose-400/30' },
    error: { icon: XCircle, label: 'Deploy error', tone: 'text-rose-200 border-rose-400/30' },
    unknown: { icon: Clock, label: 'Deploy status unavailable', tone: 'text-ink-400 border-white/10' },
  }[status.state];
  const Icon = map.icon;
  const spinning = status.state === 'queued' || status.state === 'in_progress';
  const content = (
    <>
      <Icon className={cn('h-3.5 w-3.5', spinning && 'animate-spin')} /> {map.label}
    </>
  );
  const cls = cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1', map.tone);
  return status.url ? (
    <a href={status.url} target="_blank" rel="noreferrer" className={cls}>
      {content}
    </a>
  ) : (
    <span className={cls} title={status.state === 'unknown' ? 'Give the token "Deployments: Read-only" to track Vercel deploys here.' : undefined}>
      {content}
    </span>
  );
}
