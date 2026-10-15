// The self-check `npm run package` runs on the zip it has just written: the LMS needs
// tincan.xml and index.html at the root, and the course must run from whatever folder the LMS
// unzips it into, fetching nothing from the network, so every asset path is relative.
import { strFromU8, unzipSync } from 'fflate';
import { LAUNCH_FILE } from './tincan.ts';

/** An index.html src or href that is root-absolute ("/assets", "//host") or off-site ("https:"). */
const absoluteHtmlRef = /(?<![\w-])(?:src|href)\s*=\s*["']?((?:\/|https?:)[^"'\s>]*)/gi;

/** A stylesheet url() that is root-absolute or off-site. */
const absoluteCssUrl = /\burl\(\s*["']?((?:\/|https?:)[^"')\s]*)/gi;

/** Every problem with a zip, read as the LMS would unzip it; [] when it is sound. */
export function checkZip(zip: Uint8Array): string[] {
  const files = unzipSync(zip);
  const problems: string[] = [];
  for (const required of ['tincan.xml', LAUNCH_FILE]) {
    if (!(required in files)) problems.push(`${required} is not at the root of the zip`);
  }
  for (const [path, bytes] of Object.entries(files)) {
    const pattern = path === LAUNCH_FILE ? absoluteHtmlRef : path.endsWith('.css') ? absoluteCssUrl : undefined;
    if (!pattern) continue;
    for (const [, ref] of strFromU8(bytes).matchAll(pattern)) problems.push(`${path} references ${ref}, which is not a relative path`);
  }
  return problems;
}
