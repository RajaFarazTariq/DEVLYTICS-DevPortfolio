import type { PortfolioContent } from '@/admin/lib/content';

// Keeps unpublished text edits across the "Sign in with GitHub" redirect.
// Image uploads are not kept (too large for sessionStorage); the UI says so.

const KEY = 'devlytics-admin-draft';

export type StoredDraft = {
  headSha: string;
  draft: PortfolioContent;
  deletions: string[];
};

export function saveDraft(value: StoredDraft) {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // storage full or unavailable — edits are lost on redirect, same as before
  }
}

/** Returns the stored draft once and removes it. */
export function takeDraft(): StoredDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    return raw ? (JSON.parse(raw) as StoredDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
