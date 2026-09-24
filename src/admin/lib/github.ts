import { ADMIN_CONFIG } from '@/admin/config';

const API = 'https://api.github.com';
const { owner, repo, branch } = ADMIN_CONFIG;
const repoPath = `/repos/${owner}/${repo}`;

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'GitHubError';
  }
}

/** Thrown when the content changed on GitHub after it was loaded here. */
export class ConflictError extends Error {
  constructor(readonly paths: string[]) {
    super(
      paths.length
        ? `These files were changed on GitHub after you loaded them: ${paths.join(', ')}. Reload to get the latest content, then re-apply your edits.`
        : 'The branch moved while publishing. Reload to get the latest content, then re-apply your edits.',
    );
    this.name = 'ConflictError';
  }
}

export type GitHubUser = { login: string; name: string | null; avatar_url: string };

export type RepoFile = { path: string; sha: string; text: string };

export type DirEntry = {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
};

export type FileChange =
  | { path: string; text: string }
  | { path: string; base64: string };

export type DeployState =
  | 'waiting'
  | 'queued'
  | 'in_progress'
  | 'success'
  | 'failure'
  | 'error'
  | 'unknown';

export type DeployStatus = { state: DeployState; url?: string };

export type CommitSummary = { sha: string; url: string; message: string; author: string; date: string };

function encodePath(path: string) {
  return path.split('/').map(encodeURIComponent).join('/');
}

export function decodeBase64Utf8(b64: string): string {
  const bin = atob(b64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function describeGitHubError(err: unknown): string {
  if (err instanceof ConflictError) return err.message;
  if (err instanceof GitHubError) {
    if (err.status === 401) return 'GitHub rejected the token (expired or revoked). Sign in again.';
    if (err.status === 403) {
      return /rate limit/i.test(err.message)
        ? 'GitHub API rate limit reached. Wait a few minutes and try again.'
        : `GitHub denied the request: ${err.message}. Make sure the token has "Contents: Read and write" on ${owner}/${repo}.`;
    }
    if (err.status === 404) return `Not found on GitHub: ${err.message}. Make sure the token has access to ${owner}/${repo}.`;
    return `GitHub error ${err.status}: ${err.message}`;
  }
  if (err instanceof TypeError) return 'Network error — check your connection and try again.';
  return err instanceof Error ? err.message : String(err);
}

/**
 * @param getToken returns the current GitHub token; `force` asks for a renewed one
 *   (GitHub App sessions renew through /api/auth/session, pasted tokens are returned as-is).
 */
export function createGitHubClient(getToken: (force?: boolean) => Promise<string>) {
  async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
    const token = await getToken(retried);
    const res = await fetch(`${API}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    // An expired app token is renewed once and the request repeated.
    if (res.status === 401 && !retried) return request<T>(path, init, true);
    if (!res.ok) {
      let message = res.statusText;
      try {
        message = (await res.json()).message ?? message;
      } catch {
        // non-JSON error body
      }
      throw new GitHubError(message, res.status);
    }
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  const post = <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) });

  return {
    /** Confirms the token belongs to an allowed account and can reach the repo. */
    async verifyAccess(): Promise<GitHubUser> {
      const user = await request<GitHubUser>('/user');
      const allowed = ADMIN_CONFIG.allowedLogins.some(
        (l) => l.toLowerCase() === user.login.toLowerCase(),
      );
      if (!allowed) {
        throw new Error(`@${user.login} is not allowed to manage this portfolio.`);
      }
      let repoInfo: { permissions?: { push?: boolean } };
      try {
        repoInfo = await request<{ permissions?: { push?: boolean } }>(repoPath);
      } catch (err) {
        if (err instanceof GitHubError && err.status === 404) {
          throw new Error(
            `Signed in as @${user.login}, but ${owner}/${repo} isn't accessible. Install the GitHub App on that repository (github.com → Settings → Applications → Installed GitHub Apps → Configure).`,
          );
        }
        throw err;
      }
      if (repoInfo.permissions && !repoInfo.permissions.push) {
        throw new Error(`@${user.login} does not have write access to ${owner}/${repo}.`);
      }
      return user;
    },

    async getHeadSha(): Promise<string> {
      const ref = await request<{ object: { sha: string } }>(
        `${repoPath}/git/ref/heads/${encodeURIComponent(branch)}`,
      );
      return ref.object.sha;
    },

    async getFile(path: string, ref: string): Promise<RepoFile> {
      const file = await request<{ sha: string; content: string; encoding: string }>(
        `${repoPath}/contents/${encodePath(path)}?ref=${ref}`,
      );
      return { path, sha: file.sha, text: decodeBase64Utf8(file.content) };
    },

    async listDir(path: string, ref: string): Promise<DirEntry[]> {
      try {
        const entries = await request<DirEntry[]>(
          `${repoPath}/contents/${encodePath(path)}?ref=${ref}`,
        );
        return Array.isArray(entries) ? entries : [];
      } catch (err) {
        if (err instanceof GitHubError && err.status === 404) return [];
        throw err;
      }
    },

    /**
     * Writes all changes as ONE commit on top of `parentSha` and fast-forwards
     * the branch. The ref update is never forced, so if anything else was pushed
     * in the meantime GitHub rejects it and nothing is overwritten.
     */
    async commit(opts: {
      parentSha: string;
      message: string;
      changes: FileChange[];
      deletions: string[];
    }): Promise<string> {
      const parent = await request<{ tree: { sha: string } }>(
        `${repoPath}/git/commits/${opts.parentSha}`,
      );

      const tree: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string | null }> = [];
      for (const change of opts.changes) {
        const blob = await post<{ sha: string }>(
          `${repoPath}/git/blobs`,
          'text' in change
            ? { content: change.text, encoding: 'utf-8' }
            : { content: change.base64, encoding: 'base64' },
        );
        tree.push({ path: change.path, mode: '100644', type: 'blob', sha: blob.sha });
      }
      for (const path of opts.deletions) {
        tree.push({ path, mode: '100644', type: 'blob', sha: null });
      }

      const newTree = await post<{ sha: string }>(`${repoPath}/git/trees`, {
        base_tree: parent.tree.sha,
        tree,
      });
      const commit = await post<{ sha: string }>(`${repoPath}/git/commits`, {
        message: opts.message,
        tree: newTree.sha,
        parents: [opts.parentSha],
      });

      try {
        await request(`${repoPath}/git/refs/heads/${encodeURIComponent(branch)}`, {
          method: 'PATCH',
          body: JSON.stringify({ sha: commit.sha, force: false }),
        });
      } catch (err) {
        if (err instanceof GitHubError && (err.status === 422 || err.status === 409)) {
          throw new ConflictError([]);
        }
        throw err;
      }
      return commit.sha;
    },

    /** Recent commits on the branch that touched `path` (for the dashboard's "Recent updates"). */
    async listCommits(path: string, perPage = 6): Promise<CommitSummary[]> {
      const commits = await request<
        Array<{
          sha: string;
          html_url: string;
          commit: { message: string; author: { name: string; date: string } | null };
          author: { login: string } | null;
        }>
      >(`${repoPath}/commits?sha=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}&per_page=${perPage}`);
      return commits.map((c) => ({
        sha: c.sha,
        url: c.html_url,
        message: c.commit.message.split('\n')[0],
        author: c.author?.login ?? c.commit.author?.name ?? 'unknown',
        date: c.commit.author?.date ?? '',
      }));
    },

    /** Latest Vercel deployment status for a commit (needs "Deployments: Read"). */
    async getDeployStatus(sha: string): Promise<DeployStatus> {
      const deployments = await request<Array<{ statuses_url: string }>>(
        `${repoPath}/deployments?sha=${sha}&per_page=1`,
      );
      if (!deployments.length) return { state: 'waiting' };
      const statuses = await request<
        Array<{ state: DeployState; environment_url?: string; target_url?: string }>
      >(deployments[0].statuses_url.replace(API, '') + '?per_page=1');
      if (!statuses.length) return { state: 'queued' };
      const s = statuses[0];
      return { state: s.state, url: s.environment_url || s.target_url };
    },
  };
}

export type GitHubClient = ReturnType<typeof createGitHubClient>;
