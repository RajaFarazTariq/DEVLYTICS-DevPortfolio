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
  items: MediaItem[];
  /** URL to preview an image path in the admin (pending uploads, raw GitHub, or site path). */
  resolve: (publicPath: string) => string;
  addUpload: (upload: PendingUpload, keepInLibrary?: boolean) => void;
  toggleDeletion: (repoPath: string) => void;
  removeUpload: (publicPath: string) => void;
  localMode: boolean;
};

export type Confirm = (request: ConfirmRequest) => void;

/** Request from "Fix" links to open a specific item's editor. */
export type Focus = { index?: number; nonce: number } | null;
