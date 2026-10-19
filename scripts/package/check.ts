// The self-check `npm run package` runs on the zip it has just written: the LMS needs
// tincan.xml and index.html at the root, tincan.xml must name course.yaml's course with
// index.html as its launch, and the course must run from whatever folder the LMS unzips it into,
// fetching nothing from the network, so every asset path is relative.
import { strFromU8, unzipSync } from 'fflate';
import type { Course } from '../../src/content/schema.ts';
import { readContent } from '../content.ts';
import { LAUNCH_FILE } from './tincan.ts';

/** An index.html src or href that is root-absolute ("/assets", "//host") or off-site ("https:"). */
const absoluteHtmlRef = /(?<![\w-])(?:src|href)\s*=\s*["']?((?:\/|https?:)[^"'\s>]*)/gi;

/** A stylesheet url() that is root-absolute or off-site. */
const absoluteCssUrl = /\burl\(\s*["']?((?:\/|https?:)[^"')\s]*)/gi;

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

/** XML text with its entity and character references replaced by the characters they stand for. */
function unescapeXml(text: string): string {
  return text.replace(/&(?:#x([\da-f]+)|#(\d+)|(\w+));/gi, (ref, hex?: string, dec?: string, name?: string) => {
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    if (dec) return String.fromCodePoint(parseInt(dec, 10));
    return ENTITIES[name ?? ''] ?? ref;
  });
}

const TINCAN_FIELDS = ['id', 'name', 'description', 'launch'] as const;
type Tincan = Partial<Record<(typeof TINCAN_FIELDS)[number], string>>;

/** What a tincan.xml's one activity names (its id, name, description and launch), or why it cannot be read. */
function readTincan(xml: string): Tincan | string {
  const activities = [...xml.matchAll(/<activity\b([^>]*)>([\s\S]*?)<\/activity>/g)];
  if (activities.length !== 1) return `tincan.xml has ${activities.length} activities, not 1`;
  const [, attributes, body] = activities[0];
  const read = (text: string | undefined) => (text === undefined ? undefined : unescapeXml(text));
  const child = (name: string) => read(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`).exec(body)?.[1]);
  return { id: read(/\bid\s*=\s*(["'])(.*?)\1/.exec(attributes)?.[2]), name: child('name'), description: child('description'), launch: child('launch') };
}

/**
 * Every problem with a zip, read as the LMS would unzip it; [] when it is sound. Its tincan.xml
 * is checked against `course`, by default course.yaml read afresh, not the course object the
 * packaging script wrote it from.
 */
export function checkZip(zip: Uint8Array, course: Pick<Course, 'id' | 'title' | 'description'> = readContent()): string[] {
  const files = unzipSync(zip);
  const problems: string[] = [];
  for (const required of ['tincan.xml', LAUNCH_FILE]) {
    if (!(required in files)) problems.push(`${required} is not at the root of the zip`);
  }
  if ('tincan.xml' in files) {
    const named = readTincan(strFromU8(files['tincan.xml']));
    const expected: Tincan = { id: course.id, name: course.title, description: course.description, launch: LAUNCH_FILE };
    if (typeof named === 'string') problems.push(named);
    else {
      for (const field of TINCAN_FIELDS) {
        if (named[field] !== expected[field]) problems.push(`tincan.xml's activity ${field} is ${JSON.stringify(named[field] ?? null)}, not ${JSON.stringify(expected[field])}`);
      }
    }
  }
  for (const [path, bytes] of Object.entries(files)) {
    const pattern = path === LAUNCH_FILE ? absoluteHtmlRef : path.endsWith('.css') ? absoluteCssUrl : undefined;
    if (!pattern) continue;
    for (const [, ref] of strFromU8(bytes).matchAll(pattern)) problems.push(`${path} references ${ref}, which is not a relative path`);
  }
  return problems;
}
