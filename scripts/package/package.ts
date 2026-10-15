// `npm run package`: the zip uploaded to SparkLMS (D18). Validates content/, builds the course
// into dist/agent-course/ with relative asset paths (base './') so it runs from any folder the
// LMS unzips it into, writes tincan.xml beside index.html, zips that folder's contents as
// dist/agent-course.zip, then reopens the zip and exits non-zero unless it holds tincan.xml and
// index.html at its root with every asset path relative. Run by Node's type stripping.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import { build } from 'vite';
import { parse } from 'yaml';
import { validateContent } from '../../src/content/validate.ts';
import { checkZip } from './check.ts';
import { tincanXml } from './tincan.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const contentDir = join(root, 'content');
const outDir = join(root, 'dist', 'agent-course');
const zipPath = join(root, 'dist', 'agent-course.zip');

/** Every file under a folder, keyed by its path relative to it with forward slashes. */
function readTree(dir: string, include: (path: string) => boolean = () => true): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const full = join(entry.parentPath, entry.name);
    const path = relative(dir, full).split(sep).join('/');
    if (include(path)) files[path] = readFileSync(full);
  }
  return files;
}

// content/ as src/content/index.ts globs it, parsed as the YAML plugin in vite.config.ts parses it.
const yamlFiles = readTree(contentDir, (path) => path === 'course.yaml' || /^(modules|fridge)\/[^/]+\.yaml$/.test(path));
const course = validateContent(
  Object.fromEntries(Object.entries(yamlFiles).map(([path, bytes]) => [path, parse(Buffer.from(bytes).toString('utf8'), { prettyErrors: true })])),
);

await build({ root, base: './', logLevel: 'warn', build: { outDir, emptyOutDir: true } });
writeFileSync(join(outDir, 'tincan.xml'), tincanXml(course));

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(zipPath, zipSync(readTree(outDir), { level: 9 }));

const problems = checkZip(readFileSync(zipPath));
if (problems.length > 0) {
  console.error(`${relative(root, zipPath)} failed its check:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Wrote ${relative(root, zipPath)}: tincan.xml (${course.id}) and index.html at its root, every asset path relative.`);
}
