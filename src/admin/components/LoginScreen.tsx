import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Laptop, Loader2, ShieldCheck } from 'lucide-react';
import { ADMIN_CONFIG } from '@/admin/config';
import { looksLikeGitHubToken } from '@/admin/lib/session';

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';

export function LoginScreen({
  busy,
  error,
  expired,
  hasUnsavedChanges,
  onSubmit,
  onLocalPreview,
}: {
  busy: boolean;
  error: string | null;
  expired: boolean;
  hasUnsavedChanges: boolean;
  onSubmit: (token: string) => void;
  onLocalPreview?: () => void;
}) {
  const [token, setToken] = useState('');
  const [reveal, setReveal] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = token.trim();
    if (!looksLikeGitHubToken(value)) {
      setLocalError('That does not look like a GitHub token (it should start with github_pat_ or ghp_).');
      return;
    }
    setLocalError(null);
    onSubmit(value);
  };

  const message = localError ?? error;

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

        <form onSubmit={submit} className="adm-card space-y-5 p-6">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-50">Sign in</h1>
            <p className="mt-1 text-sm text-ink-400">
              Use a GitHub fine-grained token for{' '}
              <span className="font-mono text-ink-200">
                {ADMIN_CONFIG.owner}/{ADMIN_CONFIG.repo}
              </span>
              .
            </p>
          </div>

          {expired && (
            <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              You were signed out after {Math.round(ADMIN_CONFIG.idleTimeoutMs / 60000)} minutes of inactivity.
              {hasUnsavedChanges && ' Your unpublished changes are still here — sign in again to continue.'}
            </p>
          )}

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
                autoFocus
                placeholder="github_pat_…"
                aria-invalid={!!message}
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
            {message && <p className="mt-2 text-sm text-rose-300">{message}</p>}
          </div>

          <button type="submit" className="adm-btn-primary w-full py-2.5" disabled={busy || !token.trim()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {busy ? 'Verifying…' : 'Sign in'}
          </button>

          <details className="group rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-ink-300">
            <summary className="cursor-pointer select-none font-medium text-ink-200">How to create the token</summary>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-ink-400">
              <li>
                Open{' '}
                <a href={TOKEN_URL} target="_blank" rel="noreferrer" className="text-accent-300 underline-offset-2 hover:underline">
                  GitHub → Fine-grained tokens
                </a>{' '}
                while signed in as <span className="text-ink-200">{ADMIN_CONFIG.allowedLogins[0]}</span>.
              </li>
              <li>
                Repository access: <span className="text-ink-200">Only select repositories → {ADMIN_CONFIG.repo}</span>.
              </li>
              <li>
                Permissions: <span className="text-ink-200">Contents: Read and write</span>, plus{' '}
                <span className="text-ink-200">Deployments: Read-only</span> to see Vercel deploy status.
              </li>
              <li>Pick an expiry, generate, and paste it here.</li>
            </ol>
            <p className="mt-3 text-xs text-ink-500">
              The token stays in this browser tab only (cleared when the tab closes) and is sent only to api.github.com.
            </p>
          </details>
        </form>

        {import.meta.env.DEV && onLocalPreview && (
          <button type="button" onClick={onLocalPreview} className="adm-btn-ghost mx-auto mt-4 flex text-xs">
            <Laptop className="h-3.5 w-3.5" /> Local preview with this checkout's content (dev only, publishing disabled)
          </button>
        )}
      </div>
    </div>
  );
}
