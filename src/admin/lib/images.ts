import { ADMIN_CONFIG } from '@/admin/config';

const ALLOWED_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

export const ACCEPT_IMAGES = Object.keys(ALLOWED_TYPES).join(',');

const IMAGE_EXT = /\.(png|jpe?g|webp|gif|avif|svg)$/i;

// Folders the admin manages files in: public path prefix <-> repository folder.
const MANAGED_DIRS = [
  { prefix: ADMIN_CONFIG.imagePublicPrefix, dir: ADMIN_CONFIG.imageDir },
  { prefix: ADMIN_CONFIG.resumePublicPrefix, dir: ADMIN_CONFIG.resumeDir },
];

export type PendingUpload = {
  /** Public path used in content, e.g. /assets/projects/foo-1a2b.png */
  publicPath: string;
  /** Repository path, e.g. public/assets/projects/foo-1a2b.png */
  repoPath: string;
  base64: string;
  previewUrl: string;
  size: number;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function isImageFileName(name: string) {
  return IMAGE_EXT.test(name);
}

export function isPdfFileName(name: string) {
  return /\.pdf$/i.test(name);
}

/** True for files in the project image folder (as opposed to resumes). */
export const isImageRepoPath = (repoPath: string) => repoPath.startsWith(`${ADMIN_CONFIG.imageDir}/`);
export const isResumeRepoPath = (repoPath: string) => repoPath.startsWith(`${ADMIN_CONFIG.resumeDir}/`);

/** "/assets/projects/a.png?v=2" -> "public/assets/projects/a.png" (only for managed files). */
export function publicPathToRepoPath(publicPath: string): string | null {
  const clean = publicPath.split(/[?#]/)[0];
  const managed = MANAGED_DIRS.find((m) => clean.startsWith(m.prefix));
  if (!managed) return null;
  const name = clean.slice(managed.prefix.length);
  if (!name || name.includes('/') || name.includes('..')) return null;
  return `${managed.dir}/${name}`;
}

export function repoPathToPublicPath(repoPath: string) {
  const managed = MANAGED_DIRS.find((m) => repoPath.startsWith(`${m.dir}/`)) ?? MANAGED_DIRS[0];
  return managed.prefix + repoPath.slice(managed.dir.length + 1);
}

/** GitHub's file page (renders PDFs in the browser). */
export function githubBlobUrl(repoPath: string) {
  const { owner, repo, branch } = ADMIN_CONFIG;
  return `https://github.com/${owner}/${repo}/blob/${branch}/${repoPath.split('/').map(encodeURIComponent).join('/')}`;
}

/** Preview straight from the branch so freshly committed images show before Vercel redeploys. */
export function rawImageUrl(publicPath: string) {
  const repoPath = publicPathToRepoPath(publicPath);
  if (!repoPath) return publicPath;
  const { owner, repo, branch } = ADMIN_CONFIG;
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${repoPath
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

/** Checks the real file signature, not just the extension/MIME the browser reports. */
async function sniffImageType(file: File): Promise<string | null> {
  const b = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const ascii = (from: number, to: number) => String.fromCharCode(...b.slice(from, to));
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(0, 4) === 'GIF8') return 'image/gif';
  if (ascii(4, 8) === 'ftyp' && /avi[fs]/.test(ascii(8, 12))) return 'image/avif';
  return null;
}

export async function prepareUpload(file: File, baseName: string): Promise<PendingUpload> {
  const type = await sniffImageType(file);
  if (!type || !ALLOWED_TYPES[type]) {
    throw new Error('Unsupported image. Use PNG, JPG, WebP, GIF or AVIF.');
  }
  if (file.size > ADMIN_CONFIG.maxImageBytes) {
    const mb = (ADMIN_CONFIG.maxImageBytes / 1024 / 1024).toFixed(0);
    throw new Error(`Image is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${mb} MB.`);
  }
  const stem = slugify(baseName) || 'project';
  const suffix = Date.now().toString(36);
  const fileName = `${stem}-${suffix}.${ALLOWED_TYPES[type]}`;
  const repoPath = `${ADMIN_CONFIG.imageDir}/${fileName}`;
  return {
    repoPath,
    publicPath: repoPathToPublicPath(repoPath),
    base64: await readAsBase64(file),
    previewUrl: URL.createObjectURL(file),
    size: file.size,
  };
}

/** Resume / CV upload: PDF only, checked by file signature. */
export async function prepareResumeUpload(file: File, baseName: string): Promise<PendingUpload> {
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...head) !== '%PDF-') {
    throw new Error('Unsupported file. Upload the resume as a PDF.');
  }
  if (file.size > ADMIN_CONFIG.maxResumeBytes) {
    const mb = (ADMIN_CONFIG.maxResumeBytes / 1024 / 1024).toFixed(0);
    throw new Error(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${mb} MB.`);
  }
  const stem = slugify(baseName) || 'resume';
  const fileName = `${stem}-${Date.now().toString(36)}.pdf`;
  const repoPath = `${ADMIN_CONFIG.resumeDir}/${fileName}`;
  return {
    repoPath,
    publicPath: repoPathToPublicPath(repoPath),
    base64: await readAsBase64(file),
    previewUrl: URL.createObjectURL(file),
    size: file.size,
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
