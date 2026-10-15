// tincan.xml, the manifest at the root of the package (D18): it names the course activity, its
// title and description from content/course.yaml, and index.html as the file the LMS launches.
import type { Course } from '../../src/content/schema.ts';

/** The xAPI activity type of the course activity. */
export const COURSE_ACTIVITY_TYPE = 'http://adlnet.gov/expapi/activities/course';

/** The file the LMS opens, at the root of the package. */
export const LAUNCH_FILE = 'index.html';

/** Text made safe for an XML element or a double- or single-quoted attribute. */
export function escapeXml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": 'apos' }[c]};`);
}

/** The TinCan package manifest for the course. */
export function tincanXml(course: Pick<Course, 'id' | 'title' | 'description'>): string {
  return [
    '<?xml version="1.0" encoding="utf-8" standalone="yes"?>',
    '<tincan xmlns="http://projecttincan.com/tincan.xsd">',
    '  <activities>',
    `    <activity id="${escapeXml(course.id)}" type="${COURSE_ACTIVITY_TYPE}">`,
    `      <name>${escapeXml(course.title)}</name>`,
    `      <description lang="en-US">${escapeXml(course.description)}</description>`,
    `      <launch lang="en-US">${LAUNCH_FILE}</launch>`,
    '    </activity>',
    '  </activities>',
    '</tincan>',
    '',
  ].join('\n');
}
