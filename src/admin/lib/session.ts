// The token lives in sessionStorage only: it is cleared when the tab closes and
// is never written to localStorage, cookies, or the repository.
const TOKEN_KEY = 'devlytics-admin-token';

export function loadToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string) {
  try {
    window.sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    // storage unavailable (private mode) — session lasts until reload
  }
}

export function clearToken() {
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

/** Basic shape check so obviously wrong input never reaches GitHub. */
export function looksLikeGitHubToken(token: string) {
  return /^(github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,})$/.test(token);
}
