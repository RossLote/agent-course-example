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
import { readContent } from '../content.ts';
import { checkZip } from './check.ts';
import { tincanXml } from './tincan.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const outDir = join(root, 'dist', 'agent-course');
const zipPath = join(root, 'dist', 'agent-course.zip');

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

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(zipPath, zipSync(readTree(outDir), { level: 9 }));

const problems = checkZip(readFileSync(zipPath));
if (problems.length > 0) {
  console.error(`${relative(root, zipPath)} failed its check:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Wrote ${relative(root, zipPath)}: tincan.xml (${course.id}) and index.html at its root, every asset path relative.`);
}
