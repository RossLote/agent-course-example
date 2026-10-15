// `npm run package`: the zip uploaded to SparkLMS (D18). Validates content/, builds the course
// into dist/agent-course/ with relative asset paths (base './') so it runs from any folder the
// LMS unzips it into, writes tincan.xml beside index.html, zips that folder's contents as
// dist/agent-course.zip, then reopens the zip and exits non-zero unless it holds tincan.xml
// (naming course.yaml's course) and index.html at its root with every asset path relative.
// `--out <folder>` writes both into another folder instead of dist/ (the package e2e spec
// does). `npm run build` empties dist/, zip and all, so package last. Run by Node's type
// stripping.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { zipSync } from 'fflate';
import { build } from 'vite';
import { readContent } from '../content.ts';
import { checkZip } from './check.ts';
import { tincanXml } from './tincan.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const { values } = parseArgs({ options: { out: { type: 'string' } } });
const out = values.out === undefined ? join(root, 'dist') : resolve(values.out);
const outDir = join(out, 'agent-course');
const zipPath = join(out, 'agent-course.zip');

/** Every file under a folder, keyed by its path relative to it with forward slashes. */
function readTree(dir: string): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const full = join(entry.parentPath, entry.name);
    files[relative(dir, full).split(sep).join('/')] = readFileSync(full);
  }
  return files;
}

const course = readContent();

await build({ root, base: './', logLevel: 'warn', build: { outDir, emptyOutDir: true } });
writeFileSync(join(outDir, 'tincan.xml'), tincanXml(course));

mkdirSync(out, { recursive: true });
writeFileSync(zipPath, zipSync(readTree(outDir), { level: 9 }));

const shown = relative(root, zipPath).startsWith('..') ? zipPath : relative(root, zipPath);
const problems = checkZip(readFileSync(zipPath));
if (problems.length > 0) {
  console.error(`${shown} failed its check:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Wrote ${shown}: tincan.xml (${course.id}) and index.html at its root, every asset path relative.`);
  console.log(`The zip to upload is ${shown}. npm run build empties dist/, zip and all, so run npm run package last.`);
}
