import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { checkZip } from './check.ts';
import { COURSE_ACTIVITY_TYPE, escapeXml, tincanXml } from './tincan.ts';

const course = {
  id: 'https://example.com/course/?a=1&b=2/',
  title: 'Agents <and> "you"',
  description: "Ross's course: build & check, then <check again>.",
};

/** The one activity of a tincan.xml, read back as an XML parser reads it. */
function activityOf(xml: string) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
  expect(doc.documentElement.namespaceURI).toBe('http://projecttincan.com/tincan.xsd');
  const activities = doc.getElementsByTagName('activity');
  expect(activities).toHaveLength(1);
  const activity = activities[0];
  const child = (name: string) => activity.getElementsByTagName(name)[0];
  return {
    id: activity.getAttribute('id'),
    type: activity.getAttribute('type'),
    name: child('name').textContent,
    description: child('description').textContent,
    descriptionLang: child('description').getAttribute('lang'),
    launch: child('launch').textContent,
  };
}

/** A zip of these files, with the given text as their contents. */
function zipOf(files: Record<string, string>): Uint8Array {
  return zipSync(Object.fromEntries(Object.entries(files).map(([path, text]) => [path, strToU8(text)])));
}

/** The files but one. */
function without(files: Record<string, string>, path: string): Record<string, string> {
  return Object.fromEntries(Object.entries(files).filter(([p]) => p !== path));
}

const relativeIndex = '<link rel="icon" href="./favicon.svg" /><script type="module" crossorigin src="./assets/index-a1.js"></script><link rel="stylesheet" href="./assets/index-b2.css">';

describe('tincan.xml', () => {
  it('names the course activity, its title and description, the course type and index.html as the launch', () => {
    expect(activityOf(tincanXml(course))).toEqual({
      id: course.id,
      type: COURSE_ACTIVITY_TYPE,
      name: course.title,
      description: course.description,
      descriptionLang: 'en-US',
      launch: 'index.html',
    });
    expect(COURSE_ACTIVITY_TYPE).toBe('http://adlnet.gov/expapi/activities/course');
  });

  it('escapes the five XML special characters', () => {
    expect(escapeXml(`a & b < c > d "e" 'f'`)).toBe('a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;');
    expect(tincanXml(course)).toContain('id="https://example.com/course/?a=1&amp;b=2/"');
    expect(tincanXml(course)).toContain('<name>Agents &lt;and&gt; &quot;you&quot;</name>');
  });
});

describe('the zip self-check', () => {
  const sound = { 'tincan.xml': tincanXml(course), 'index.html': relativeIndex, 'assets/index-b2.css': '@font-face{src:url(./manrope.woff2)}' };

  it('passes a zip with tincan.xml and index.html at its root and every asset path relative', () => {
    expect(checkZip(zipOf(sound))).toEqual([]);
  });

  it('fails a zip missing tincan.xml', () => {
    expect(checkZip(zipOf(without(sound, 'tincan.xml')))).toEqual(['tincan.xml is not at the root of the zip']);
  });

  it('fails a zip missing index.html, or with the files under a folder', () => {
    expect(checkZip(zipOf(without(sound, 'index.html')))).toEqual(['index.html is not at the root of the zip']);
    expect(checkZip(zipOf({ 'dist/tincan.xml': sound['tincan.xml'], 'dist/index.html': relativeIndex }))).toEqual([
      'tincan.xml is not at the root of the zip',
      'index.html is not at the root of the zip',
    ]);
  });

  it('fails an index.html or stylesheet that references a root-absolute or off-site path', () => {
    const problems = checkZip(
      zipOf({
        ...sound,
        'index.html': '<script src="/assets/index-a1.js"></script><link href="https://fonts.example.com/x.css"><link href=//cdn.example.com/y.css>',
        'assets/index-b2.css': '@font-face{src:url("/assets/manrope.woff2")}',
      }),
    );
    expect(problems).toEqual([
      'index.html references /assets/index-a1.js, which is not a relative path',
      'index.html references https://fonts.example.com/x.css, which is not a relative path',
      'index.html references //cdn.example.com/y.css, which is not a relative path',
      'assets/index-b2.css references /assets/manrope.woff2, which is not a relative path',
    ]);
  });
});
