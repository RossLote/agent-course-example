// content/ read on Node, for the packaging script and the e2e specs: the files
// src/content/index.ts globs (course.yaml, modules/*.yaml, fridge/*.yaml), parsed as the YAML
// plugin in vite.config.ts parses them, and validated as the app validates them at startup.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import type { Course } from '../src/content/schema.ts';
import { validateContent } from '../src/content/validate.ts';

const contentDir = fileURLToPath(new URL('../content/', import.meta.url));

/** The validated course from the files under content/; throws a ContentError as the app would. */
export function readContent(): Course {
  const yamlIn = (dir: string) =>
    readdirSync(join(contentDir, dir), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.yaml'))
      .map((entry) => `${dir}/${entry.name}`);
  const paths = ['course.yaml', ...yamlIn('modules'), ...yamlIn('fridge')];
  return validateContent(Object.fromEntries(paths.map((path) => [path, parse(readFileSync(join(contentDir, path), 'utf8'), { prettyErrors: true })])));
}
