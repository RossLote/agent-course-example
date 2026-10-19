// content/ read on Node, for the packaging script and the e2e specs: the files
// src/content/index.ts globs (course.yaml, modules/*.yaml, fridge/*.yaml), picked as Vite's glob
// picks them, parsed by the one YAML parse the plugin uses (scripts/yaml.ts), and validated as
// the app validates them at startup.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Course } from '../src/content/schema.ts';
import { validateContent } from '../src/content/validate.ts';
import { parseYaml } from './yaml.ts';

// From the module's own path, not new URL(), which is jsdom's in the unit tests.
const contentDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'content');

/**
 * The paths under `dir` that src/content/index.ts's import.meta.glob picks, as Vite's glob
 * picks them: course.yaml, and every file in modules/ and fridge/ (not their sub-folders)
 * named *.yaml, skipping dotfiles (the glob has no `exhaustive`) and following symlinks; sorted.
 */
export function contentPaths(dir = contentDir): string[] {
  const yamlIn = (folder: string) =>
    existsSync(join(dir, folder))
      ? readdirSync(join(dir, folder))
          .filter((name) => !name.startsWith('.') && name.endsWith('.yaml'))
          .map((name) => `${folder}/${name}`)
      : [];
  const isFile = (path: string) => statSync(join(dir, path), { throwIfNoEntry: false })?.isFile() ?? false;
  return ['course.yaml', ...yamlIn('modules'), ...yamlIn('fridge')].filter(isFile).sort();
}

/** The validated course from the files under content/; throws a ContentError as the app would. */
export function readContent(): Course {
  return validateContent(
    Object.fromEntries(contentPaths().map((path) => [path, parseYaml(readFileSync(join(contentDir, path), 'utf8'), join(contentDir, path))])),
  );
}
