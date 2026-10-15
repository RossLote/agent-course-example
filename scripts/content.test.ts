// The app's content module uses import.meta.glob, which this Node project's types lack.
/// <reference types="vite/client" />
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { contentFiles, course } from '../src/content/index.ts';
import { contentPaths, readContent } from './content.ts';

describe('readContent', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it("picks the files the app's import.meta.glob picks, and reads the course the app reads", () => {
    expect(contentPaths()).toEqual(Object.keys(contentFiles).sort());
    expect(readContent()).toEqual(course);
  });

  it('skips dotfiles, other extensions and sub-folders as the glob does, and follows a symlink as it does', () => {
    const dir = mkdtempSync(join(tmpdir(), 'content-'));
    dirs.push(dir);
    for (const folder of ['modules', 'modules/drafts', 'fridge', 'elsewhere']) mkdirSync(join(dir, folder));
    for (const file of ['course.yaml', 'modules/00.yaml', 'modules/._00.yaml', 'modules/.01.yaml', 'modules/notes.txt', 'modules/02.YAML', 'modules/drafts/03.yaml', 'fridge/.DS_Store', 'elsewhere/one-shot.yaml']) {
      writeFileSync(join(dir, file), 'a: 1\n');
    }
    symlinkSync(join(dir, 'elsewhere/one-shot.yaml'), join(dir, 'fridge/one-shot.yaml'));
    symlinkSync(join(dir, 'missing.yaml'), join(dir, 'fridge/broken.yaml'));
    mkdirSync(join(dir, 'modules/folder.yaml'));

    expect(contentPaths(dir)).toEqual(['course.yaml', 'fridge/one-shot.yaml', 'modules/00.yaml']);
  });
});
