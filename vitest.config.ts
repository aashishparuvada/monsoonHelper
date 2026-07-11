import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // Default to plain Node for fast pure-logic tests; files that touch
    // the DOM/localStorage opt in with a `// @vitest-environment jsdom`
    // docblock instead of paying jsdom's startup cost everywhere.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
