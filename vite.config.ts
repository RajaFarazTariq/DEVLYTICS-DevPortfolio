import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const escapeHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Writes the page title and meta description managed in /admin (src/content/settings.json)
// into the public index.html at build time, so search engines see them without running JS.
function siteMeta(): Plugin {
  return {
    name: 'site-meta',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        if (path.basename(ctx.filename) !== 'index.html' || ctx.filename.includes(`${path.sep}admin${path.sep}`) || ctx.path.startsWith('/admin')) {
          return html;
        }
        const file = path.resolve(process.cwd(), 'src/content/settings.json');
        const { site } = JSON.parse(fs.readFileSync(file, 'utf8')) as { site?: { title?: string; description?: string } };
        let out = html;
        if (site?.title) out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(site.title)}</title>`);
        if (site?.description) {
          out = out.replace(/(<meta\s+name="description"\s+content=")[\s\S]*?("\s*\/?>)/, `$1${escapeHtml(site.description)}$2`);
        }
        return out;
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), siteMeta()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      // The admin panel is a separate page (/admin/) so the public site never loads its code.
      input: {
        main: path.resolve(process.cwd(), 'index.html'),
        admin: path.resolve(process.cwd(), 'admin/index.html'),
      },
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['framer-motion'],
        },
      },
    },
  },
});
