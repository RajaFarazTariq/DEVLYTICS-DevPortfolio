import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  FolderKanban,
  Globe,
  Github,
  Images,
  LayoutDashboard,
  Loader2,
  LogOut,
  PanelsTopLeft,
  RefreshCw,
  Rocket,
  RotateCcw,
  Sparkles,
  Type,
  UserRound,
  XCircle,
} from 'lucide-react';
import { ADMIN_CONFIG, CONTENT_FILES, CONTENT_KEYS, repoUrl, type ContentKey } from '@/admin/config';
import {
  ConflictError,
  GitHubError,
  createGitHubClient,
  describeGitHubError,
  type CommitSummary,
  type DeployStatus,
  type DirEntry,
  type FileChange,
  type GitHubClient,
  type GitHubUser,
} from '@/admin/lib/github';
import { clearToken, loadToken, saveToken } from '@/admin/lib/session';
import {
  AuthExpiredError,
  appSignOut,
  consumeAuthErrorFromUrl,
  createTokenSource,
  fetchAppSession,
  startGitHubSignIn,
  type AppAuthAvailability,
  type TokenSource,
} from '@/admin/lib/auth';
import { clearDraft, saveDraft, takeDraft } from '@/admin/lib/draftStore';
import { parseSection, serializeSection, type PortfolioContent } from '@/admin/lib/content';
import { validateSection, type Issue, type ValidationContext } from '@/admin/lib/validate';
import {
  githubBlobUrl,
  isImageFileName,
  isImageRepoPath,
  isPdfFileName,
  isResumeRepoPath,
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
import { AboutSection } from '@/admin/sections/AboutSection';
import { SettingsSection } from '@/admin/sections/SettingsSection';
import { ResumeSection } from '@/admin/sections/ResumeSection';
import { SiteSection } from '@/admin/sections/SiteSection';
import { TextSection } from '@/admin/sections/TextSection';
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
  resumes: DirEntry[];
};

type Upload = PendingUpload & { keep: boolean };

/** settings.json feeds several admin pages; its issues are routed by field. */
function settingsPage(field: string): 'settings' | 'site' | 'text' | 'projects' {
  if (field.startsWith('site.')) return 'site';
  if (field.startsWith('text.')) return 'text';
  if (field.startsWith('projectCategories')) return 'projects';
  return 'settings';
}

type Phase = 'checking' | 'signed-out' | 'verifying' | 'loading' | 'ready' | 'error';

const TABS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, group: 'General' },
  { id: 'profile', label: 'Profile & Contact', icon: UserRound, group: 'Content' },
  { id: 'about', label: 'About', icon: BookOpen, group: 'Content' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, group: 'Content' },
  { id: 'skills', label: 'Skills', icon: Sparkles, group: 'Content' },
  { id: 'experience', label: 'Experience & Education', icon: Briefcase, group: 'Content' },
  { id: 'settings', label: 'Sections', icon: PanelsTopLeft, group: 'Site' },
  { id: 'site', label: 'Site & SEO', icon: Globe, group: 'Site' },
  { id: 'text', label: 'Site text', icon: Type, group: 'Site' },
  { id: 'media', label: 'Media', icon: Images, group: 'Assets' },
  { id: 'resume', label: 'Resume / CV', icon: FileText, group: 'Assets' },
] as const;

const NAV_GROUPS = ['General', 'Content', 'Site', 'Assets'] as const;

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
  resumes: DirEntry[],
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
  return { mode, headSha, files, baseline, original: original as PortfolioContent, images, resumes };
}

export function AdminApp() {
  const [auth, setAuth] = useState<TokenSource | null>(null);
  const [appAuth, setAppAuth] = useState<AppAuthAvailability>('checking');
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [phase, setPhase] = useState<Phase>('checking');
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
  const [history, setHistory] = useState<CommitSummary[] | null>(null);

  const client = useMemo(() => (auth ? createGitHubClient(auth.get) : null), [auth]);
  const loadedRef = useRef(loaded);
  loadedRef.current = loaded;
  const authRef = useRef(auth);
  authRef.current = auth;

  /** Ends the GitHub session (revoking an app token). Any loaded draft stays in memory. */
  const endSession = useCallback((opts: { expired?: boolean; message?: string | null } = {}) => {
    const current = authRef.current;
    if (current?.method === 'github-app') void appSignOut(current.peek());
    else if (current) clearToken();
    setAuth(null);
    setUser(null);
    setExpired(Boolean(opts.expired));
    if (opts.message !== undefined) setAuthError(opts.message);
    setPublishOpen(false);
    setPhase('signed-out');
  }, []);

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
        const [images, resumes] = await Promise.all([
          c.listDir(ADMIN_CONFIG.imageDir, headSha),
          c.listDir(ADMIN_CONFIG.resumeDir, headSha),
        ]);
        applyLoaded(buildLoaded('github', headSha, files, images, resumes));
        // "Recent updates" on the dashboard; optional, so failures are ignored.
        c.listCommits('src/content')
          .then(setHistory)
          .catch(() => setHistory([]));
        if (!quiet) {
          // Edits saved before the sign-in redirect come back if GitHub hasn't moved since.
          const stored = takeDraft();
          if (stored?.headSha === headSha) {
            setDraft(stored.draft);
            setDeletions(stored.deletions);
            setToast({ tone: 'success', text: 'Restored your unpublished changes from before signing in.' });
          } else if (stored) {
            setToast({ tone: 'error', text: "Content changed on GitHub while you were signed out, so your unpublished edits couldn't be restored." });
          }
        }
        setPhase('ready');
      } catch (err) {
        if (err instanceof AuthExpiredError) {
          endSession({ expired: true });
          return;
        }
        if (quiet) {
          setToast({ tone: 'error', text: `Published, but refreshing failed: ${describeGitHubError(err)} Reload before editing again.` });
          return;
        }
        setLoadError(describeGitHubError(err));
        setPhase('error');
      }
    },
    [applyLoaded, endSession],
  );

  // Resume a session on load: GitHub App session cookie first, then a token pasted in this tab.
  useEffect(() => {
    let cancelled = false;
    const urlError = consumeAuthErrorFromUrl();
    if (urlError) setAuthError(urlError);
    void fetchAppSession().then((session) => {
      if (cancelled) return;
      if (session.status === 'ok') {
        setAppAuth('available');
        setAuth(createTokenSource('github-app', session));
        return;
      }
      setAppAuth(session.status === 'unavailable' ? session.reason : 'available');
      const pasted = loadToken();
      if (pasted) setAuth(createTokenSource('token', { accessToken: pasted, expiresAt: Number.POSITIVE_INFINITY }));
      else setPhase('signed-out');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Verify the account (after sign-in, on reload, or after an idle sign-out).
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
        endSession({ message: describeGitHubError(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [client, loadFromGitHub, endSession]);

  const signInWithToken = (value: string) => {
    saveToken(value);
    setAuthError(null);
    setAuth(createTokenSource('token', { accessToken: value, expiresAt: Number.POSITIVE_INFINITY }));
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
            about: await import('@/content/about.json'),
            settings: await import('@/content/settings.json'),
          };
          const files = {} as Record<ContentKey, LoadedFile>;
          for (const key of CONTENT_KEYS) {
            files[key] = { sha: 'local', text: JSON.stringify(mods[key].default, null, 2) + '\n' };
          }
          setExpired(false);
          applyLoaded(buildLoaded('local', 'local', files, [], []));
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

  // Managed files the draft points at: project images and the active resume.
  const referencedImages = useMemo(() => {
    const refs = new Set((draft?.projects ?? []).map((p) => cleanPath(p.image)));
    if (draft?.profile.resume) refs.add(cleanPath(draft.profile.resume));
    return refs;
  }, [draft]);

  const uploadsToCommit = useMemo(
    () => Object.values(uploads).filter((u) => u.keep || referencedImages.has(u.publicPath)),
    [uploads, referencedImages],
  );

  const dirty = changedKeys.length > 0 || uploadsToCommit.length > 0 || deletions.length > 0;

  const ctx = useMemo<ValidationContext>(
    () => ({
      fileExists: (publicPath) => {
        const clean = cleanPath(publicPath);
        if (!clean.startsWith(ADMIN_CONFIG.imagePublicPrefix) && !clean.startsWith(ADMIN_CONFIG.resumePublicPrefix)) return true;
        const repoPath = publicPathToRepoPath(clean);
        if (!repoPath) return false;
        if (!loaded || loaded.mode === 'local') return true;
        if (uploads[clean]) return true;
        return [...loaded.images, ...loaded.resumes].some((e) => e.path === repoPath) && !deletions.includes(repoPath);
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
    const pending = uploadsToCommit.filter((u) => isImageRepoPath(u.repoPath)).map((u) => ({
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

  const resumeItems = useMemo<MediaItem[]>(() => {
    const active = draft?.profile.resume ? cleanPath(draft.profile.resume) : '';
    const usedBy = (publicPath: string) => (publicPath === active ? ['Active resume'] : []);
    const pending = uploadsToCommit.filter((u) => isResumeRepoPath(u.repoPath)).map((u) => ({
      publicPath: u.publicPath,
      repoPath: u.repoPath,
      name: u.repoPath.split('/').pop() ?? u.repoPath,
      size: u.size,
      pending: true,
      markedForDeletion: false,
      usedBy: usedBy(u.publicPath),
    }));
    const existing = (loaded?.resumes ?? [])
      .filter((e) => e.type === 'file' && isPdfFileName(e.name))
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
    resumes: resumeItems,
    localMode: loaded?.mode === 'local',
    openUrl: (item) => {
      if (uploads[item.publicPath]) return uploads[item.publicPath].previewUrl;
      return loaded?.mode === 'local' ? item.publicPath : githubBlobUrl(item.repoPath);
    },
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
    if (phase !== 'ready' || !auth) return;
    let last = Date.now();
    const bump = () => {
      last = Date.now();
    };
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const timer = window.setInterval(() => {
      if (Date.now() - last < ADMIN_CONFIG.idleTimeoutMs || publishing) return;
      endSession({ expired: true });
    }, 15_000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      window.clearInterval(timer);
    };
  }, [phase, auth, publishing, endSession]);

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
      endSession();
      clearDraft();
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
        throw new Error(`These files are still used by a project or as the active resume and can't be deleted: ${stillUsed.join(', ')}`);
      }
      const headFiles =
        head === loaded.headSha
          ? [...loaded.images, ...loaded.resumes]
          : (await Promise.all([client.listDir(ADMIN_CONFIG.imageDir, head), client.listDir(ADMIN_CONFIG.resumeDir, head)])).flat();
      const safeDeletions = allDeletions.filter((p) => headFiles.some((e) => e.path === p));

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
      if (err instanceof AuthExpiredError) {
        endSession({ expired: true });
        return;
      }
      setConflict(err instanceof ConflictError);
      setPublishError(describeGitHubError(err));
    } finally {
      setPublishing(false);
    }
  };

  const goToIssue = (issue: Issue) => {
    setPublishOpen(false);
    setTab(
      issue.section === 'profile' && issue.field === 'resume'
        ? 'resume'
        : issue.section === 'settings'
          ? settingsPage(issue.field)
          : issue.section,
    );
    setFocus({ section: issue.section, index: issue.index, nonce: Date.now() });
  };

  const focusFor = (section: ContentKey): Focus =>
    focus && focus.section === section ? { index: focus.index, nonce: focus.nonce } : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  const signInWithGitHub = (chooseAccount: boolean) => {
    // The sign-in leaves the page; keep unpublished text edits for when it comes back.
    if (dirty && draft && loaded?.mode === 'github') saveDraft({ headSha: loaded.headSha, draft, deletions });
    startGitHubSignIn(chooseAccount);
  };

  if (phase === 'checking' || phase === 'signed-out' || phase === 'verifying') {
    return (
      <LoginScreen
        checking={phase === 'checking'}
        busy={phase === 'verifying'}
        appAuth={appAuth}
        error={authError}
        expired={expired}
        hasUnsavedChanges={dirty}
        hasUnpublishedUploads={uploadsToCommit.length > 0}
        onGitHubSignIn={signInWithGitHub}
        onTokenSubmit={signInWithToken}
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
    if (id === 'media') {
      return { changed: uploadsToCommit.some((u) => isImageRepoPath(u.repoPath)) || deletions.some(isImageRepoPath), issues: 0 };
    }
    if (id === 'resume') {
      const changed =
        (draft.profile.resume ?? '') !== (loaded.original.profile.resume ?? '') ||
        uploadsToCommit.some((u) => isResumeRepoPath(u.repoPath)) ||
        deletions.some(isResumeRepoPath);
      return { changed, issues: issues.filter((i) => i.section === 'profile' && i.field === 'resume').length };
    }
    if (id === 'profile') {
      return { changed: changedKeys.includes(id), issues: issues.filter((i) => i.section === id && i.field !== 'resume').length };
    }
    if (id === 'settings' || id === 'site' || id === 'text') {
      const part = id === 'settings' ? 'sections' : id;
      return {
        changed: JSON.stringify(draft.settings[part]) !== JSON.stringify(loaded.original.settings[part]),
        issues: issues.filter((i) => i.section === 'settings' && settingsPage(i.field) === id).length,
      };
    }
    if (id === 'projects') {
      const categoriesChanged = JSON.stringify(draft.settings.projectCategories) !== JSON.stringify(loaded.original.settings.projectCategories);
      return {
        changed: changedKeys.includes(id) || categoriesChanged,
        issues: issues.filter((i) => i.section === id || (i.section === 'settings' && settingsPage(i.field) === 'projects')).length,
      };
    }
    return { changed: changedKeys.includes(id), issues: issues.filter((i) => i.section === id).length };
  };

  const navItem = (t: (typeof TABS)[number]) => {
    const s = sectionState(t.id);
    const Icon = t.icon;
    const active = tab === t.id;
    return (
      <button key={t.id} type="button" onClick={() => setTab(t.id)} aria-current={active ? 'page' : undefined} className="adm-nav-item group">
        <span
          className={cn(
            'grid h-7 w-7 shrink-0 place-items-center rounded-md border transition',
            active ? 'border-accent-400/30 bg-accent-500/15 text-accent-200' : 'border-white/[0.06] bg-white/[0.02] text-ink-400 group-hover:text-ink-200',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1 truncate">{t.label}</span>
        {s.issues > 0 && (
          <span className="rounded-full bg-rose-500/20 px-1.5 py-px text-[10px] font-semibold text-rose-200" title="Issues to fix">
            {s.issues}
          </span>
        )}
        {s.changed && <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.15)]" title="Unpublished changes" />}
      </button>
    );
  };

  const tabItem = (t: (typeof TABS)[number]) => {
    const s = sectionState(t.id);
    const Icon = t.icon;
    return (
      <button key={t.id} type="button" onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined} className="adm-tab">
        <Icon className="h-3.5 w-3.5" />
        {t.label}
        {s.issues > 0 && <span className="rounded-full bg-rose-500/25 px-1.5 text-[10px] font-semibold text-rose-100">{s.issues}</span>}
        {s.changed && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Unpublished changes" />}
      </button>
    );
  };

  const currentTab = TABS.find((t) => t.id === tab) ?? TABS[0];
  const changeCount = changedKeys.length + uploadsToCommit.length + deletions.length;

  const repoBadge =
    loaded.mode === 'local' ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 font-medium text-amber-200">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Local preview · publishing disabled
      </span>
    ) : (
      <a
        href={`${repoUrl}/tree/${ADMIN_CONFIG.branch}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-ink-300 transition hover:border-white/[0.16] hover:text-ink-100"
      >
        <Github className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{ADMIN_CONFIG.repo}</span>
        <span className="text-ink-500">@{ADMIN_CONFIG.branch}</span>
        <span className="font-mono text-ink-500">{loaded.headSha.slice(0, 7)}</span>
      </a>
    );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      <aside className="hidden border-r border-white/[0.06] bg-ink-950/60 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] px-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-violet-600 font-display font-bold text-white shadow-glow">
            D
          </span>
          <div className="leading-tight">
            <p className="font-display text-[15px] font-bold text-ink-50">Devlytics</p>
            <p className="text-xs text-ink-400">Admin panel</p>
          </div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Admin sections">
          {NAV_GROUPS.map((group) => (
            <div key={group}>
              <p className="adm-eyebrow mb-2 px-2.5">{group}</p>
              <div className="space-y-0.5">{TABS.filter((t) => t.group === group).map(navItem)}</div>
            </div>
          ))}
        </nav>
        <div className="space-y-2 border-t border-white/[0.06] p-3">
          <a href="/" target="_blank" rel="noreferrer" className="adm-nav-item group">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/[0.06] bg-white/[0.02] text-ink-400 transition group-hover:text-ink-200">
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1">View live site</span>
          </a>
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
            {user ? (
              <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-full border border-white/10" />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.05] text-xs font-semibold text-ink-300">L</span>
            )}
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-ink-100">{user ? user.name || user.login : 'Local preview'}</p>
              <p className="truncate text-xs text-ink-400">{user ? `@${user.login}` : 'Not signed in'}</p>
            </div>
            <button type="button" className="adm-icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-accent-500 to-violet-600 font-display text-sm font-bold text-white lg:hidden">
              D
            </span>
            <div className="min-w-0">
              <p className="hidden items-center gap-1 text-[11px] text-ink-500 sm:flex">
                Admin <ChevronRight className="h-3 w-3" /> {currentTab.group}
              </p>
              <p className="truncate font-display text-[15px] font-semibold leading-tight text-ink-50">{currentTab.label}</p>
            </div>
            <div className="ml-3 hidden min-w-0 items-center gap-2 text-xs xl:flex">
              {repoBadge}
              {deploy && <DeployPill status={deploy} />}
            </div>
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              {dirty && (
                <span className="hidden items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200 md:inline-flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  {changeCount} unpublished change{changeCount === 1 ? '' : 's'}
                </span>
              )}
              <button type="button" className="adm-btn-ghost max-sm:px-2.5" onClick={discardAll} disabled={!dirty} title="Discard all unpublished changes">
                <RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">Discard</span>
              </button>
              <button type="button" className="adm-btn-primary" onClick={openPublish} disabled={!dirty}>
                <Rocket className="h-4 w-4" /> <span className="hidden sm:inline">Review & publish</span>
                <span className="sm:hidden">Publish</span>
              </button>
              <button type="button" className="adm-icon-btn lg:hidden" onClick={signOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-4 pb-3 text-xs sm:px-6 lg:px-8 xl:hidden">
            {repoBadge}
            {deploy && <DeployPill status={deploy} />}
          </div>
          <nav className="scrollbar-none flex gap-1.5 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden" aria-label="Admin sections">
            {TABS.map(tabItem)}
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
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
              history={history}
              mediaCount={mediaItems.length}
              onNavigate={(t) => setTab(t)}
            />
          )}
          {tab === 'profile' && (
            <ProfileSection
              profile={draft.profile}
              onChange={(v) => update('profile', v)}
              issues={issues.filter((i) => i.section === 'profile' && i.field !== 'resume')}
            />
          )}
          {tab === 'about' && (
            <AboutSection
              about={draft.about}
              onChange={(v) => update('about', v)}
              issues={issues.filter((i) => i.section === 'about')}
            />
          )}
          {tab === 'settings' && (
            <SettingsSection
              settings={draft.settings}
              onChange={(v) => update('settings', v)}
              issues={issues.filter((i) => i.section === 'settings' && settingsPage(i.field) === 'settings')}
              publishedProjects={draft.projects.filter((p) => !p.hidden).length}
            />
          )}
          {tab === 'site' && (
            <SiteSection
              settings={draft.settings}
              onChange={(v) => update('settings', v)}
              issues={issues.filter((i) => i.section === 'settings' && settingsPage(i.field) === 'site')}
            />
          )}
          {tab === 'text' && (
            <TextSection
              settings={draft.settings}
              onChange={(v) => update('settings', v)}
              issues={issues.filter((i) => i.section === 'settings' && settingsPage(i.field) === 'text')}
            />
          )}
          {tab === 'resume' && (
            <ResumeSection
              active={draft.profile.resume ?? ''}
              onActiveChange={(resume) => update('profile', { ...draft.profile, resume })}
              media={media}
              confirm={setConfirmRequest}
              issues={issues.filter((i) => i.section === 'profile' && i.field === 'resume')}
            />
          )}
          {tab === 'projects' && (
            <ProjectsSection
              projects={draft.projects}
              onChange={(v) => update('projects', v)}
              issues={issues.filter((i) => i.section === 'projects' || (i.section === 'settings' && settingsPage(i.field) === 'projects'))}
              ctx={ctx}
              categories={draft.settings.projectCategories}
              onCategoriesChange={(projectCategories, projects) => {
                update('settings', { ...draft.settings, projectCategories });
                update('projects', projects);
              }}
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
            'adm-animate-pop fixed bottom-4 left-4 right-4 z-[70] flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-xl sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm',
            toast.tone === 'success'
              ? 'border-emerald-400/25 bg-ink-900/95 text-emerald-100'
              : 'border-rose-400/25 bg-ink-900/95 text-rose-100',
          )}
        >
          {toast.tone === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
          )}
          <span className="leading-relaxed">{toast.text}</span>
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
