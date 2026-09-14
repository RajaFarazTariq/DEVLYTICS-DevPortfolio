import { ADMIN_CONFIG } from '@/admin/config';

// Client side of "Sign in with GitHub" (see api/auth/[action].ts).

export type AuthMethod = 'github-app' | 'token';

/** Whether GitHub App sign-in can be used from this page. */
export type AppAuthAvailability = 'checking' | 'available' | 'not_configured' | 'no_backend';

export class AuthExpiredError extends Error {
  constructor(message = 'Your GitHub session ended. Sign in again to continue.') {
    super(message);
    this.name = 'AuthExpiredError';
  }
}

type SessionToken = { accessToken: string; expiresAt: number };

export type AppSessionResult =
  | ({ status: 'ok' } & SessionToken)
  | { status: 'none'; error?: string }
  | { status: 'unavailable'; reason: 'not_configured' | 'no_backend' };

/** Asks the auth function for a GitHub token from the session cookies. */
export async function fetchAppSession(force = false): Promise<AppSessionResult> {
  let res: Response;
  try {
    res = await fetch('/api/auth/session', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force }),
    });
  } catch {
    return { status: 'unavailable', reason: 'no_backend' };
  }
  if (!res.headers.get('content-type')?.includes('application/json')) {
    return { status: 'unavailable', reason: 'no_backend' };
  }
  const data = (await res.json().catch(() => ({}))) as Partial<SessionToken> & { error?: string };
  if (res.ok && typeof data.accessToken === 'string' && typeof data.expiresAt === 'number') {
    return { status: 'ok', accessToken: data.accessToken, expiresAt: data.expiresAt };
  }
  if (data.error === 'not_configured') return { status: 'unavailable', reason: 'not_configured' };
  return { status: 'none', error: data.error };
}

export type TokenSource = {
  method: AuthMethod;
  /** Current token; renews GitHub App tokens shortly before they expire, or when forced after a 401. */
  get: (force?: boolean) => Promise<string>;
  /** Last known token without renewing (used to revoke on sign-out). */
  peek: () => string;
};

const RENEW_BEFORE_MS = 5 * 60 * 1000;

export function createTokenSource(method: AuthMethod, initial: SessionToken): TokenSource {
  let current = initial;
  let inflight: Promise<string> | null = null;

  return {
    method,
    peek: () => current.accessToken,
    get(force = false) {
      if (method === 'token') return Promise.resolve(current.accessToken);
      if (!force && Date.now() < current.expiresAt - RENEW_BEFORE_MS) {
        return Promise.resolve(current.accessToken);
      }
      if (!inflight) {
        inflight = fetchAppSession(force)
          .then((result) => {
            if (result.status !== 'ok') throw new AuthExpiredError();
            current = result;
            return result.accessToken;
          })
          .finally(() => {
            inflight = null;
          });
      }
      return inflight;
    },
  };
}

export function startGitHubSignIn(chooseAccount: boolean) {
  window.location.assign(`/api/auth/login${chooseAccount ? '?select_account=1' : ''}`);
}

export async function appSignOut(accessToken?: string) {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    });
  } catch {
    // cookies expire on their own; nothing else to do
  }
}

const AUTH_ERRORS: Record<string, string> = {
  denied: 'Sign-in was cancelled on GitHub.',
  not_allowed: `That GitHub account can't manage this portfolio. Use "Choose a different GitHub account" and sign in as ${ADMIN_CONFIG.allowedLogins[0]}.`,
  state_mismatch: 'That sign-in attempt expired or was started in another tab. Please try again.',
  exchange_failed: "GitHub didn't accept the sign-in. Check GITHUB_APP_CLIENT_ID and GITHUB_APP_CLIENT_SECRET in Vercel.",
  not_configured: 'GitHub sign-in is not set up yet: add GITHUB_APP_CLIENT_ID and GITHUB_APP_CLIENT_SECRET in Vercel, then redeploy.',
  github_error: 'GitHub returned an error during sign-in. Please try again.',
};

/** Reads ?auth_error= left by the callback, removes it from the address bar, returns a message. */
export function consumeAuthErrorFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('auth_error');
  if (!code) return null;
  params.delete('auth_error');
  const query = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  return AUTH_ERRORS[code] ?? `Sign-in failed (${code}). Please try again.`;
}
