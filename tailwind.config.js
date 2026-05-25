/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f7f8fb',
          100: '#eef0f6',
          200: '#dbdfeb',
          300: '#b9c0d4',
          400: '#8b94b1',
          500: '#5e6883',
          600: '#404a64',
          700: '#2a3147',
          800: '#161b2c',
          900: '#0b0f1c',
          950: '#060814',
        },
        accent: {
          50: '#eef4ff',
          100: '#dde8ff',
          200: '#bcd1ff',
          300: '#8bb1ff',
          400: '#5e8bff',
          500: '#3a66ff',
          600: '#2649e6',
          700: '#1f3ab8',
          800: '#1d3290',
          900: '#1c2d72',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      backgroundImage: {
        'grid-dark':
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        'grid-light':
          'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
        'radial-spotlight':
          'radial-gradient(circle at 50% 0%, rgba(94, 139, 255, 0.18), transparent 60%)',
        'gradient-text':
          'linear-gradient(135deg, #5e8bff 0%, #a78bfa 50%, #ec4899 100%)',
      },
      boxShadow: {
        glass:
          '0 8px 32px 0 rgba(0, 0, 0, 0.18), inset 0 1px 0 0 rgba(255,255,255,0.06)',
        glow: '0 0 40px -8px rgba(94, 139, 255, 0.45)',
        soft: '0 12px 40px -12px rgba(2, 6, 23, 0.6)',
      },
      animation: {
        'fade-in': 'fadeIn 0.7s ease-out forwards',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        marquee: 'marquee 40s linear infinite',
        'spin-slow': 'spin 18s linear infinite',
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 0.55 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
