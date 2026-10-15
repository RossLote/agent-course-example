import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import readme from '../../content/README.md?raw';
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

describe('content/', () => {
  it('validates every file: course.yaml, the eight modules and the fridges', () => {
    const files = Object.keys(contentFiles).sort();
    expect(files).toEqual(expect.arrayContaining(['course.yaml', 'fridge/accepted.yaml', 'fridge/one-shot.yaml']));
    expect(files.filter((f) => f.startsWith('modules/'))).toHaveLength(8);
    expect(problems(contentFiles)).toEqual([]);
  });

  it('gives the app a course with its 8 modules in order and the fridges by name', () => {
    expect(course.id).toBe('https://rosslote.github.io/agent-course/');
    expect(course.modules.map((m) => m.slug)).toEqual(['00', '01', '02', '03', '04', '05', '06', '07']);
    for (const m of course.modules) expect(m.screens.at(-1)?.type).toBe('takeaway');
    expect(Object.keys(course.fridges).sort()).toEqual(['accepted', 'one-shot']);
  });

  it('fails on a misspelt field, naming the file and the path to it', () => {
    const bad = withFile('modules/00.yaml', (m) => {
      screensOf(m)[0].headnig = 'A typo';
    });
    expect(problems(bad)).toEqual(['content/modules/00.yaml screens[0].headnig: unknown field "headnig"']);
    expect(() => validateContent(bad)).toThrow('content/modules/00.yaml screens[0].headnig: unknown field "headnig"');
  });

  it('fails on an unknown screen type and on a missing field', () => {
    const bad = withFile('modules/01.yaml', (m) => {
      screensOf(m)[0] = { type: 'quiz' };
      delete screensOf(m)[1].heading;
    });
    expect(problems(bad)).toEqual([
      expect.stringMatching(/^content\/modules\/01\.yaml screens\[0\]\.type: /),
      expect.stringMatching(/^content\/modules\/01\.yaml screens\[1\]\.heading: /),
    ]);
  });

  it('fails when a screen names a fridge that has no file', () => {
    const bad = withFile('modules/02.yaml', (m) => {
      screensOf(m).splice(0, 0, { type: 'fridge', heading: 'A fridge', fridge: 'freezer' });
    });
    expect(problems(bad)).toEqual(['content/modules/02.yaml screens[0].fridge: there is no fridge "freezer" (content/fridge/freezer.yaml)']);
  });

  it('fails when two interactions in a module share a slug', () => {
    const bad = withFile('modules/03.yaml', (m) => {
      const first = screensOf(m).find((s) => typeof s.slug === 'string');
      screensOf(m).splice(0, 0, { ...first });
    });
    expect(problems(bad)).toEqual([expect.stringMatching(/^content\/modules\/03\.yaml screens\[\d+\]\.slug: slug ".+" is used twice$/)]);
  });

  it('fails when course.yaml lists a module file that does not exist', () => {
    const bad = withFile('course.yaml', (c) => {
      (c.modules as Record<string, unknown>[])[7].file = 'modules/99.yaml';
    });
    expect(problems(bad)).toEqual([
      'content/course.yaml modules[7].file: content/modules/99.yaml does not exist',
      'content/modules/07.yaml: is not listed in course.yaml modules',
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
  const walls = ['none', 'record', 'done', 'gate', 'agents', 'evidence', 'ring', 'all'] as const;
  const modules = walls.map((wall, i) => ({ slug: `0${i}`, wall }));

  it('draws a module wall and every earlier one, the ring from 06, everything at 07', () => {
    expect(boxAfter(modules, '00')).toEqual({ walls: [], ring: false });
    expect(boxAfter(modules, '03')).toEqual({ walls: ['record', 'done', 'gate'], ring: false });
    expect(boxAfter(modules, '06')).toEqual({ walls: ['record', 'done', 'gate', 'agents', 'evidence'], ring: true });
    expect(boxAfter(modules, '07')).toEqual({ walls: ['record', 'done', 'gate', 'agents', 'evidence'], ring: true });
  });
});
