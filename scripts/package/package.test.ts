import { describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { ACTIVITY_TYPES } from '../../src/xapi/vocabulary.ts';
import { readContent } from '../content.ts';
import { checkZip } from './check.ts';
import { escapeXml, tincanXml } from './tincan.ts';

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
      type: ACTIVITY_TYPES.course,
      name: course.title,
      description: course.description,
      descriptionLang: 'en-US',
      launch: 'index.html',
    });
    expect(ACTIVITY_TYPES.course).toBe('http://adlnet.gov/expapi/activities/course');
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
    expect(checkZip(zipOf(sound), course)).toEqual([]);
  });

  it('fails a zip missing tincan.xml', () => {
    expect(checkZip(zipOf(without(sound, 'tincan.xml')), course)).toEqual(['tincan.xml is not at the root of the zip']);
  });

  it('fails a zip missing index.html, or with the files under a folder', () => {
    expect(checkZip(zipOf(without(sound, 'index.html')), course)).toEqual(['index.html is not at the root of the zip']);
    expect(checkZip(zipOf({ 'dist/tincan.xml': sound['tincan.xml'], 'dist/index.html': relativeIndex }), course)).toEqual([
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
      course,
    );
    expect(problems).toEqual([
      'index.html references /assets/index-a1.js, which is not a relative path',
      'index.html references https://fonts.example.com/x.css, which is not a relative path',
      'index.html references //cdn.example.com/y.css, which is not a relative path',
      'assets/index-b2.css references /assets/manrope.woff2, which is not a relative path',
    ]);
  });

  it('checks tincan.xml against course.yaml by default: its activity id, name and description, and index.html as the launch', () => {
    const real = readContent();
    const files = { ...sound, 'tincan.xml': tincanXml(real) };
    expect(checkZip(zipOf(files))).toEqual([]);
    expect(checkZip(zipOf({ ...files, 'tincan.xml': tincanXml({ ...real, id: 'https://example.com/another-course/' }) }))).toEqual([
      `tincan.xml's activity id is "https://example.com/another-course/", not ${JSON.stringify(real.id)}`,
    ]);
  });

  it('fails a tincan.xml that names another title, drops the description, launches another file or has no single activity', () => {
    const xml = tincanXml(course);
    const changed = xml
      .replace('<name>Agents &lt;and&gt; &quot;you&quot;</name>', '<name>Agents</name>')
      .replace(/\s*<description[^]*?<\/description>/, '')
      .replace('<launch lang="en-US">index.html</launch>', '<launch lang="en-US">start.html</launch>');
    expect(checkZip(zipOf({ ...sound, 'tincan.xml': changed }), course)).toEqual([
      `tincan.xml's activity name is "Agents", not ${JSON.stringify(course.title)}`,
      `tincan.xml's activity description is null, not ${JSON.stringify(course.description)}`,
      `tincan.xml's activity launch is "start.html", not "index.html"`,
    ]);
    expect(checkZip(zipOf({ ...sound, 'tincan.xml': '<tincan><activities></activities></tincan>' }), course)).toEqual(['tincan.xml has 0 activities, not 1']);
  });
});
