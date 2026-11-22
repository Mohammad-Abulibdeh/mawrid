/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://<user>.github.io/mawrid/ on GitHub Pages.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/mawrid/',
  plugins: [react()],
  build: { sourcemap: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: { include: ['src/domain/**'], reporter: ['text', 'json-summary'] },
  },
});
