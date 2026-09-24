import base from './tailwind.config.js';

/**
 * Tailwind config for the admin panel only (loaded via @config in
 * src/admin/admin.css), so admin styles never end up in the public site's CSS.
 * @type {import('tailwindcss').Config}
 */
export default {
  ...base,
  // src/data holds the colour presets the admin previews (About cards, skill icons).
  content: ['./admin/index.html', './src/admin/**/*.{ts,tsx}', './src/data/**/*.ts'],
};
