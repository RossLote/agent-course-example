import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { yamlContent } from './scripts/yaml.ts';

export default defineConfig({
  plugins: [react(), yamlContent()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    setupFiles: ['src/testSetup.ts'],
  },
});
