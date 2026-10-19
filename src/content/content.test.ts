import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import readme from '../../content/README.md?raw';
import { FIXTURE_WALLS } from '../course/frame/fixture.ts';
import { block, fridgeFile, screen } from './schema.ts';
import { ContentError, activityId, activityPath, boxAfter, contentFiles, course, fridgeActivityPath, moduleActivityPath, validateContent, type Screen } from './index.ts';

/** contentFiles with one file replaced by a changed copy of itself. */
function withFile(file: string, change: (data: Record<string, unknown>) => void): Record<string, unknown> {
  const data = structuredClone(contentFiles[file]) as Record<string, unknown>;
  change(data);
  return { ...contentFiles, [file]: data };
}

/** The problems validateContent reports, or [] when it passes. */
function problems(files: Record<string, unknown>): string[] {
  try {
    validateContent(files);
    return [];
  } catch (error) {
    if (error instanceof ContentError) return error.problems;
    throw error;
  }
}

const screensOf = (data: Record<string, unknown>) => data.screens as Record<string, unknown>[];

// The tests that change a file take whichever module files course.yaml lists, so they hold
// whatever the modules say and however many there are.
const entries = (contentFiles['course.yaml'] as { modules: { slug: string; file: string }[] }).modules;
const moduleFile = (i: number) => entries[i].file;

describe('content/', () => {
  it('validates every file: course.yaml, every module file it lists and the fridges', () => {
    const files = Object.keys(contentFiles).sort();
    expect(files).toEqual(expect.arrayContaining(['course.yaml', 'fridge/accepted.yaml', 'fridge/one-shot.yaml']));
    expect(files.filter((f) => f.startsWith('modules/'))).toEqual(entries.map((e) => e.file).sort());
    expect(problems(contentFiles)).toEqual([]);
  });

  it("gives the app a course with course.yaml's modules in order, numbered from 00, and the fridges by name", () => {
    expect(course.id).toBe('https://rosslote.github.io/agent-course/');
    expect(course.modules.map((m) => m.slug)).toEqual(entries.map((e) => e.slug));
    expect(course.modules.map((m) => m.slug)).toEqual(course.modules.map((_, i) => String(i).padStart(2, '0')));
    for (const m of course.modules) expect(m.screens.at(-1)?.type).toBe('takeaway');
    const fridges = Object.keys(contentFiles).flatMap((f) => (f.startsWith('fridge/') ? [f.replace(/^fridge\/(.*)\.yaml$/, '$1')] : []));
    expect(Object.keys(course.fridges).sort()).toEqual(fridges.sort());
  });

  it('ends every module the same way: the takeaway says "Takeaway", and Check 1 of 2 says what a check is', () => {
    for (const m of course.modules) {
      expect(m.screens.at(-1), `module ${m.slug}`).toMatchObject({ type: 'takeaway', eyebrow: 'Takeaway' });
      for (const s of m.screens.filter((s) => s.eyebrow === 'Check · 1 of 2')) {
        expect(s, `module ${m.slug}`).toMatchObject({ intro: 'Every module ends with two of these. Each option tells you why, right or wrong.' });
      }
    }
  });

  it('fails on a misspelt field, naming the file and the path to it', () => {
    const file = moduleFile(0);
    const bad = withFile(file, (m) => {
      screensOf(m)[0].headnig = 'A typo';
    });
    expect(problems(bad)).toEqual([`content/${file} screens[0].headnig: unknown field "headnig"`]);
    expect(() => validateContent(bad)).toThrow(`content/${file} screens[0].headnig: unknown field "headnig"`);
  });

  it('fails on an unknown screen type and on a missing field', () => {
    const file = moduleFile(entries.length > 1 ? 1 : 0);
    const bad = withFile(file, (m) => {
      screensOf(m).splice(0, 0, { type: 'quiz' }, { type: 'scene', blocks: [{ type: 'paragraph', text: 'Text.' }] });
    });
    expect(problems(bad).map((p) => p.slice(0, p.indexOf(': ')))).toEqual([`content/${file} screens[0].type`, `content/${file} screens[1].heading`]);
  });

  it('fails when a screen names a fridge that has no file', () => {
    const file = moduleFile(entries.length - 1);
    const bad = withFile(file, (m) => {
      screensOf(m).splice(0, 0, { type: 'fridge', heading: 'A fridge', fridge: 'freezer' });
    });
    expect(problems(bad)).toEqual([`content/${file} screens[0].fridge: there is no fridge "freezer" (content/fridge/freezer.yaml)`]);
  });

  it('fails when two interactions in a module share a slug', () => {
    const file = moduleFile(entries.length - 1);
    const bad = withFile(file, (m) => {
      screensOf(m).splice(0, 0, { type: 'chat', slug: 'twice', heading: 'One', opening: 'Hi.', messages: ['Hello.'] }, { type: 'chat', slug: 'twice', heading: 'Two', opening: 'Hi.', messages: ['Hello.'] });
    });
    expect(problems(bad)).toEqual([`content/${file} screens[1].slug: slug "twice" is used twice`]);
  });

  it('fails on a wall course.yaml does not allow, naming the field', () => {
    const withWall = (wall: unknown) =>
      problems(
        withFile('course.yaml', (c) => {
          (c.modules as Record<string, unknown>[])[0].wall = wall;
        }),
      );
    const allowed = 'must be none, one of record, gate, agents, evidence, a list of two of them, or ring';
    expect(withWall('done')).toEqual([`content/course.yaml modules[0].wall: ${allowed}`]);
    expect(withWall('all')).toEqual([`content/course.yaml modules[0].wall: ${allowed}`]);
    expect(withWall(['record', 'gate', 'agents'])).toEqual(['content/course.yaml modules[0].wall: must list exactly two walls']);
    expect(withWall(['gate', 'ring'])[0]).toMatch(/^content\/course\.yaml modules\[0\]\.wall\[1\]: /);
  });

  it('fails when two modules add the same wall, one of them in a list of two', () => {
    const last = entries.length - 1;
    const bad = withFile('course.yaml', (c) => {
      const modules = c.modules as Record<string, unknown>[];
      for (const m of modules) m.wall = 'none';
      modules[0].wall = 'gate';
      modules[last].wall = ['agents', 'gate'];
    });
    expect(problems(bad)).toEqual([`content/course.yaml modules[${last}].wall: wall "gate" is used twice`]);
  });

  it('fails when course.yaml lists a module file that does not exist', () => {
    const last = entries.length - 1;
    const bad = withFile('course.yaml', (c) => {
      (c.modules as Record<string, unknown>[])[last].file = 'modules/99.yaml';
    });
    expect(problems(bad)).toEqual([
      `content/course.yaml modules[${last}].file: content/modules/99.yaml does not exist`,
      `content/${moduleFile(last)}: is not listed in course.yaml modules`,
    ]);
  });
});

describe('content/README.md', () => {
  // Every example marked "# screen", "# blocks" or "# fridge" is copyable: it validates.
  const examples = [...readme.matchAll(/```yaml\n# (screen|blocks|fridge)\n([\s\S]*?)```/g)].map((m) => ({ kind: m[1], data: parse(m[2]) as unknown }));
  const schemas = { screen: screen.array(), blocks: block.array(), fridge: fridgeFile };

  it('has an example of every screen type, and they and its other examples validate', () => {
    const types = examples.filter((e) => e.kind === 'screen').flatMap((e) => (e.data as { type: string }[]).map((s) => s.type));
    expect(new Set(types)).toEqual(new Set(['scene', 'chat', 'brief', 'choose', 'match', 'order', 'fridge', 'compare', 'takeaway']));
    for (const { kind, data } of examples) {
      const result = schemas[kind as keyof typeof schemas].safeParse(data);
      expect(result.error?.issues ?? [], `the ${kind} example ${JSON.stringify(data).slice(0, 60)}`).toEqual([]);
    }
  });
});

describe('activityPath (D24)', () => {
  const check = (slug: string): Screen => ({ type: 'choose', slug, heading: 'Q', scored: true, mode: 'single', options: [] });
  const module = {
    slug: '04',
    screens: [
      { type: 'scene', heading: 'S', blocks: [] },
      { type: 'choose', slug: 'verdict', heading: 'V', scored: false, mode: 'single', options: [] },
      check('door'),
      { type: 'match', slug: 'who-catches-it', heading: 'M', scored: false, targets: [], rows: [] },
      check('evidence'),
      { type: 'fridge', heading: 'F', fridge: 'one-shot' },
      { type: 'compare', heading: 'C', left: 'one-shot', right: 'accepted', table: { rows: [] } },
      { type: 'takeaway', text: 'T', caption: 'C' },
    ] satisfies Screen[],
  };
  const path = (i: number) => activityPath(module, module.screens[i]);

  it('numbers the checks, the scored chooses, from 1 within their module', () => {
    expect(path(2)).toBe('modules/04/checks/1');
    expect(path(4)).toBe('modules/04/checks/2');
  });

  it('puts every other interaction under its slug, and a fridge under its name', () => {
    expect(path(1)).toBe('modules/04/interactions/verdict');
    expect(path(3)).toBe('modules/04/interactions/who-catches-it');
    expect(path(5)).toBe('fridge/one-shot');
  });

  it('gives no path to scene, compare and takeaway', () => {
    expect([path(0), path(6), path(7)]).toEqual([null, null, null]);
  });

  it('makes full ids under the course id', () => {
    const id = 'https://rosslote.github.io/agent-course/';
    expect(activityId({ id }, moduleActivityPath(module))).toBe(`${id}modules/04`);
    expect(activityId({ id }, fridgeActivityPath('accepted'))).toBe(`${id}fridge/accepted`);
    expect(activityId({ id }, path(2) ?? '')).toBe(`${id}modules/04/checks/1`);
  });
});

describe('boxAfter', () => {
  const modules = FIXTURE_WALLS.map((wall, i) => ({ slug: `0${i}`, wall }));

  it("draws a module's walls, none, one or two, and every earlier module's, in the order of the walls", () => {
    expect(boxAfter(modules, '00')).toEqual({ walls: [], ring: false });
    expect(boxAfter(modules, '01')).toEqual({ walls: ['record'], ring: false });
    expect(boxAfter(modules, '02')).toEqual({ walls: ['record', 'gate', 'agents'], ring: false });
    expect(boxAfter(modules, '03')).toEqual({ walls: ['record', 'gate', 'agents', 'evidence'], ring: false });
  });

  it('adds the ring from the module that adds it', () => {
    expect(boxAfter(modules, '04')).toEqual({ walls: ['record', 'gate', 'agents', 'evidence'], ring: true });
  });
});
