import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { parse } from 'yaml';

/**
 * Parses each imported .yaml file at build time into a module exporting its data, so the
 * content reaches the bundle as JavaScript and nothing is fetched at run time. YAML 1.2 core
 * schema: `no` stays a string, and a key written twice is an error, not a silent overwrite.
 * src/content/ validates the data.
 */
function yamlContent(): Plugin {
  return {
    name: 'yaml-content',
    transform(source, id) {
      if (!/\.ya?ml$/.test(id)) return null;
      try {
        return { code: `export default ${JSON.stringify(parse(source, { prettyErrors: true }))};`, map: null };
      } catch (error) {
        this.error(`${id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), yamlContent()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    setupFiles: ['src/testSetup.ts'],
  },
});
