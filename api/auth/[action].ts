// "Sign in with GitHub" for the admin panel (/admin), backed by a GitHub App.
//
//   GET  /api/auth/login     -> redirects to GitHub's authorize page
//   GET  /api/auth/callback  -> exchanges the code, checks the account, sets session cookies
//   POST /api/auth/session   -> returns a short-lived GitHub token (renewing it when needed)
//   POST /api/auth/logout    -> revokes the token and clears the cookies
//
// Environment variables (Vercel → Settings → Environment Variables):
//   GITHUB_APP_CLIENT_ID, GITHUB_APP_CLIENT_SECRET   (required)
//   ADMIN_ALLOWED_LOGINS                             (optional, comma-separated; default RajaFarazTariq)
//
// Stores nothing server-side. Tokens live only in HttpOnly cookies scoped to /api/auth,
// so scripts on the page can never read the renewal token.

const STATE_COOKIE = '__Secure-adm-state';
const ACCESS_COOKIE = '__Secure-adm-at';
const REFRESH_COOKIE = '__Secure-adm-rt';
const COOKIE_PATH = '/api/auth';
const ADMIN_PATH = '/admin/';
const DEFAULT_ALLOWED_LOGINS = 'RajaFarazTariq';
const DEFAULT_TOKEN_SECONDS = 8 * 60 * 60;
const MIN_REMAINING_MS = 10 * 60 * 1000;

type Config = { clientId: string; clientSecret: string; allowedLogins: string[] };

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  error?: string;
};

function getConfig(): Config | null {
  const clientId = process.env.GITHUB_APP_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  const allowedLogins = (process.env.ADMIN_ALLOWED_LOGINS || DEFAULT_ALLOWED_LOGINS)
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean);
  return { clientId, clientSecret, allowedLogins };
}

function publicOrigin(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? url.host;
  const proto = request.headers.get('x-forwarded-proto')?.split(',')[0].trim() ?? url.protocol.slice(0, -1);
  return `${proto}://${host}`;
}

// Session endpoints only answer same-origin requests from the admin page.
function isSameOrigin(request: Request) {
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return false;
  const origin = request.headers.get('origin');
  if (origin && origin !== publicOrigin(request)) return false;
  return Boolean(site || origin);
}

function parseCookies(request: Request) {
  const out: Record<string, string> = {};
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    try {
      out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      // ignore malformed cookie
    }
  }
  return out;
}

function cookie(name: string, value: string, maxAgeSeconds: number, sameSite: 'Strict' | 'Lax' = 'Strict') {
  return `${name}=${encodeURIComponent(value)}; Path=${COOKIE_PATH}; Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}; HttpOnly; Secure; SameSite=${sameSite}`;
}

const clearCookie = (name: string, sameSite: 'Strict' | 'Lax' = 'Strict') => cookie(name, '', 0, sameSite);

function withCookies(headers: Headers, cookies: string[]) {
  for (const c of cookies) headers.append('Set-Cookie', c);
  return headers;
}

function json(status: number, body: unknown, cookies: string[] = []) {
  const headers = withCookies(
    new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }),
    cookies,
  );
  return new Response(JSON.stringify(body), { status, headers });
}

function redirect(location: string, cookies: string[] = []) {
  const headers = withCookies(
    new Headers({ Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }),
    cookies,
  );
  return new Response(null, { status: 302, headers });
}

const backToAdmin = (request: Request, error: string | null, cookies: string[] = []) =>
  redirect(`${publicOrigin(request)}${ADMIN_PATH}${error ? `?auth_error=${error}` : ''}`, cookies);

function randomHex(bytes: number) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const githubApiHeaders = (extra: Record<string, string> = {}) => ({
  Accept: 'application/vnd.github+json',
  'User-Agent': 'devlytics-admin',
  'X-GitHub-Api-Version': '2022-11-28',
  ...extra,
});

async function exchangeToken(config: Config, params: Record<string, string>): Promise<TokenResponse> {
  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'devlytics-admin' },
      body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, ...params }),
    });
    if (!res.ok) return { error: `http_${res.status}` };
    return (await res.json()) as TokenResponse;
  } catch {
    return { error: 'network' };
  }
}

async function revokeToken(config: Config, accessToken: string) {
  try {
    await fetch(`https://api.github.com/applications/${config.clientId}/token`, {
      method: 'DELETE',
      headers: githubApiHeaders({
        Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ access_token: accessToken }),
    });
  } catch {
    // best effort — cookies are cleared regardless
  }
}

/** Cookies for a fresh token set. Access cookie value is "<expiresAtMs>.<token>". */
function sessionCookies(tokens: TokenResponse & { access_token: string }) {
  const seconds = tokens.expires_in ?? DEFAULT_TOKEN_SECONDS;
  const expiresAt = Date.now() + seconds * 1000;
  const cookies = [cookie(ACCESS_COOKIE, `${expiresAt}.${tokens.access_token}`, seconds)];
  cookies.push(
    tokens.refresh_token
      ? cookie(REFRESH_COOKIE, tokens.refresh_token, tokens.refresh_token_expires_in ?? 180 * 24 * 60 * 60)
      : clearCookie(REFRESH_COOKIE),
  );
  return { cookies, expiresAt };
}

function readAccessCookie(value: string | undefined) {
  if (!value) return null;
  const dot = value.indexOf('.');
  const expiresAt = Number(value.slice(0, dot));
  const token = value.slice(dot + 1);
  if (dot < 1 || !Number.isFinite(expiresAt) || !token) return null;
  return { token, expiresAt };
}

// ── Routes ───────────────────────────────────────────────────────────────────

function login(request: Request) {
  const config = getConfig();
  if (!config) return backToAdmin(request, 'not_configured');

  const state = randomHex(32);
  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', config.clientId);
  authorize.searchParams.set('redirect_uri', `${publicOrigin(request)}/api/auth/callback`);
  authorize.searchParams.set('state', state);
  authorize.searchParams.set('login', config.allowedLogins[0]);
  if (new URL(request.url).searchParams.get('select_account') === '1') {
    authorize.searchParams.set('prompt', 'select_account');
  }
  // Lax: the cookie must come back on the top-level redirect from github.com.
  return redirect(authorize.toString(), [cookie(STATE_COOKIE, state, 600, 'Lax')]);
}

async function callback(request: Request) {
  const clearState = clearCookie(STATE_COOKIE, 'Lax');
  const config = getConfig();
  if (!config) return backToAdmin(request, 'not_configured', [clearState]);

  const params = new URL(request.url).searchParams;
  const githubError = params.get('error');
  if (githubError) {
    return backToAdmin(request, githubError === 'access_denied' ? 'denied' : 'github_error', [clearState]);
  }

  const state = params.get('state') ?? '';
  const expected = parseCookies(request)[STATE_COOKIE] ?? '';
  if (!state || !expected || !safeEqual(state, expected)) {
    return backToAdmin(request, 'state_mismatch', [clearState]);
  }

  const code = params.get('code');
  if (!code) return backToAdmin(request, 'github_error', [clearState]);

  const tokens = await exchangeToken(config, { code, redirect_uri: `${publicOrigin(request)}/api/auth/callback` });
  if (!tokens.access_token) return backToAdmin(request, 'exchange_failed', [clearState]);

  let login = '';
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: githubApiHeaders({ Authorization: `Bearer ${tokens.access_token}` }),
    });
    if (res.ok) login = ((await res.json()) as { login?: string }).login ?? '';
  } catch {
    // treated as not allowed below
  }
  const allowed = config.allowedLogins.some((l) => l.toLowerCase() === login.toLowerCase());
  if (!login || !allowed) {
    await revokeToken(config, tokens.access_token);
    return backToAdmin(request, 'not_allowed', [clearState]);
  }

  const session = sessionCookies(tokens as TokenResponse & { access_token: string });
  return backToAdmin(request, null, [clearState, ...session.cookies]);
}

async function session(request: Request) {
  const config = getConfig();
  if (!config) return json(500, { error: 'not_configured' });
  if (!isSameOrigin(request)) return json(403, { error: 'forbidden' });

  let force = false;
  try {
    force = Boolean(((await request.json()) as { force?: boolean }).force);
  } catch {
    // empty body
  }

  const cookies = parseCookies(request);
  const access = readAccessCookie(cookies[ACCESS_COOKIE]);
  if (!force && access && access.expiresAt - Date.now() > MIN_REMAINING_MS) {
    return json(200, { accessToken: access.token, expiresAt: access.expiresAt });
  }

  const refreshToken = cookies[REFRESH_COOKIE];
  if (!refreshToken) {
    return access && access.expiresAt > Date.now() && !force
      ? json(200, { accessToken: access.token, expiresAt: access.expiresAt })
      : json(401, { error: 'no_session' }, [clearCookie(ACCESS_COOKIE)]);
  }

  const tokens = await exchangeToken(config, { grant_type: 'refresh_token', refresh_token: refreshToken });
  if (!tokens.access_token) {
    return json(401, { error: 'expired' }, [clearCookie(ACCESS_COOKIE), clearCookie(REFRESH_COOKIE)]);
  }
  const renewed = sessionCookies(tokens as TokenResponse & { access_token: string });
  return json(200, { accessToken: tokens.access_token, expiresAt: renewed.expiresAt }, renewed.cookies);
}

async function logout(request: Request) {
  if (!isSameOrigin(request)) return json(403, { error: 'forbidden' });
  const config = getConfig();
  const tokens = new Set<string>();
  const fromCookie = readAccessCookie(parseCookies(request)[ACCESS_COOKIE]);
  if (fromCookie) tokens.add(fromCookie.token);
  try {
    const body = (await request.json()) as { accessToken?: unknown };
    if (typeof body.accessToken === 'string' && body.accessToken) tokens.add(body.accessToken);
  } catch {
    // empty body
  }
  if (config) await Promise.all([...tokens].map((t) => revokeToken(config, t)));
  return json(200, { ok: true }, [clearCookie(ACCESS_COOKIE), clearCookie(REFRESH_COOKIE)]);
}

const actionOf = (request: Request) => new URL(request.url).pathname.split('/').filter(Boolean).pop();

export async function GET(request: Request) {
  switch (actionOf(request)) {
    case 'login':
      return login(request);
    case 'callback':
      return callback(request);
    default:
      return json(404, { error: 'not_found' });
  }
}

export async function POST(request: Request) {
  switch (actionOf(request)) {
    case 'session':
      return session(request);
    case 'logout':
      return logout(request);
    default:
      return json(404, { error: 'not_found' });
  }
}
