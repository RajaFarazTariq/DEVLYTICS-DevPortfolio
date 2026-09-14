import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, Github, KeyRound, Laptop, Loader2, ShieldCheck } from 'lucide-react';
import { ADMIN_CONFIG } from '@/admin/config';
import type { AppAuthAvailability } from '@/admin/lib/auth';
import { looksLikeGitHubToken } from '@/admin/lib/session';

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';

export function LoginScreen({
  checking,
  busy,
  appAuth,
  error,
  expired,
  hasUnsavedChanges,
  hasUnpublishedUploads,
  onGitHubSignIn,
  onTokenSubmit,
  onLocalPreview,
}: {
  checking: boolean;
  busy: boolean;
  appAuth: AppAuthAvailability;
  error: string | null;
  expired: boolean;
  hasUnsavedChanges: boolean;
  hasUnpublishedUploads: boolean;
  onGitHubSignIn: (chooseAccount: boolean) => void;
  onTokenSubmit: (token: string) => void;
  onLocalPreview?: () => void;
}) {
  const [token, setToken] = useState('');
  const [reveal, setReveal] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const appReady = appAuth === 'available';
  const owner = ADMIN_CONFIG.allowedLogins[0];

  const submitToken = (e: FormEvent) => {
    e.preventDefault();
    const value = token.trim();
    if (!looksLikeGitHubToken(value)) {
      setTokenError('That does not look like a GitHub token (it should start with github_pat_ or ghp_).');
      return;
    }
    setTokenError(null);
    onTokenSubmit(value);
  };

  const signIn = (chooseAccount: boolean) => {
    setRedirecting(true);
    onGitHubSignIn(chooseAccount);
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(94,139,255,0.18),transparent_45%),radial-gradient(circle_at_90%_30%,rgba(167,139,250,0.12),transparent_50%)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-violet-600 font-display text-lg font-bold text-white shadow-glow">
            D
          </span>
          <div>
            <p className="font-display text-lg font-bold text-ink-50">Devlytics Admin</p>
            <p className="text-xs text-ink-400">Portfolio content manager</p>
          </div>
        </div>

        <div className="adm-card space-y-5 p-6">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-50">Sign in</h1>
            <p className="mt-1 text-sm text-ink-400">Use your GitHub account to manage your portfolio.</p>
          </div>

          {expired && (
            <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Your session ended.
              {hasUnsavedChanges &&
                ` Your unpublished edits are kept and will be restored after you sign in${hasUnpublishedUploads ? ' (re-add any new image uploads)' : ''}.`}
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}

          {checking ? (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-ink-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking your session…
            </div>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                className="adm-btn adm-btn-lg w-full bg-white font-semibold text-ink-950 shadow-soft hover:bg-ink-100"
                disabled={!appReady || busy || redirecting}
                onClick={() => signIn(false)}
              >
                {busy || redirecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Github className="h-5 w-5" />}
                {busy ? 'Verifying…' : redirecting ? 'Opening GitHub…' : 'Sign in with GitHub'}
              </button>
              {appReady && (
                <button
                  type="button"
                  className="mx-auto block text-xs text-ink-400 underline-offset-2 hover:text-ink-100 hover:underline"
                  disabled={busy || redirecting}
                  onClick={() => signIn(true)}
                >
                  Signed in to GitHub with another account? Choose a different GitHub account
                </button>
              )}
              {appAuth === 'not_configured' && (
                <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                  GitHub sign-in isn't set up on this deployment yet (GITHUB_APP_CLIENT_ID / GITHUB_APP_CLIENT_SECRET are missing in Vercel). You can use an access token below meanwhile.
                </p>
              )}
              {appAuth === 'no_backend' && (
                <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-ink-400">
                  GitHub sign-in runs on the deployed site (or <span className="font-mono">vercel dev</span>). On this local dev server, use an access token or Local preview.
                </p>
              )}
            </div>
          )}

          <details className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-ink-300" open={!checking && !appReady}>
            <summary className="cursor-pointer select-none font-medium text-ink-200">Use an access token instead</summary>
            <form onSubmit={submitToken} className="mt-4 space-y-3">
              <div>
                <label htmlFor="token" className="adm-label">
                  Personal access token
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                  <input
                    id="token"
                    type={reveal ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="github_pat_…"
                    aria-invalid={!!tokenError}
                    className="adm-input pl-10 pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((r) => !r)}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-ink-400 hover:text-ink-100"
                    aria-label={reveal ? 'Hide token' : 'Show token'}
                  >
                    {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {tokenError && <p className="mt-2 text-sm text-rose-300">{tokenError}</p>}
              </div>
              <button type="submit" className="adm-btn-secondary w-full" disabled={busy || !token.trim()}>
                <ShieldCheck className="h-4 w-4" /> Sign in with token
              </button>
              <p className="text-xs text-ink-500">
                Create a{' '}
                <a href={TOKEN_URL} target="_blank" rel="noreferrer" className="text-accent-300 underline-offset-2 hover:underline">
                  fine-grained token
                </a>{' '}
                for {ADMIN_CONFIG.repo} with Contents: Read and write. It stays in this tab only.
              </p>
            </form>
          </details>

          <p className="text-center text-xs text-ink-500">Only @{owner} can make changes.</p>
        </div>

        {import.meta.env.DEV && onLocalPreview && (
          <button type="button" onClick={onLocalPreview} className="adm-btn-ghost mx-auto mt-4 flex text-xs">
            <Laptop className="h-3.5 w-3.5" /> Local preview with this checkout's content (dev only, publishing disabled)
          </button>
        )}
      </div>
    </div>
  );
}
