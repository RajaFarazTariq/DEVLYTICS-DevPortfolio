import type { ConfirmRequest } from '@/admin/components/ui';
import type { PendingUpload } from '@/admin/lib/images';

export type MediaItem = {
  publicPath: string;
  repoPath: string;
  name: string;
  size: number;
  pending: boolean;
  markedForDeletion: boolean;
  usedBy: string[];
};

export type MediaApi = {
  /** Project images. */
  items: MediaItem[];
  /** Resume / CV PDFs. */
  resumes: MediaItem[];
  /** URL to preview an image path in the admin (pending uploads, raw GitHub, or site path). */
  resolve: (publicPath: string) => string;
  /** URL to open a file (a resume) in a new tab. */
  openUrl: (item: MediaItem) => string;
  addUpload: (upload: PendingUpload, keepInLibrary?: boolean) => void;
  toggleDeletion: (repoPath: string) => void;
  removeUpload: (publicPath: string) => void;
  localMode: boolean;
};

export type Confirm = (request: ConfirmRequest) => void;

/** Request from "Fix" links to open a specific item's editor. */
export type Focus = { index?: number; nonce: number } | null;
