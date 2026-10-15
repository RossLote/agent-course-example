// Validates every file under content/ against the schema, then what no single file can check:
// every fridge a screen names has a file, each module file course.yaml lists exists and says it
// is that module, and no module file is left out. All problems are collected, each naming
// the file and the path to the bad field, and thrown as one ContentError.
import type { z } from 'zod';
import { courseFile, fridgeFile, moduleFile, slugPattern, type Course, type Fridge, type Module, type ModuleFile } from './schema.ts';

type Issue = z.ZodError['issues'][number];

/** Every problem in content/, one line each: `content/<file> <path>: <what is wrong>`. */
export class ContentError extends Error {
  readonly problems: string[];
  constructor(problems: string[]) {
    super(`content/ is invalid (${problems.length} ${problems.length === 1 ? 'problem' : 'problems'}):\n${problems.map((p) => `  ${p}`).join('\n')}`);
    this.name = 'ContentError';
    this.problems = problems;
  }
}

/** `['screens', 3, 'options', 1]` → `screens[3].options[1]`. */
function formatPath(path: readonly PropertyKey[]): string {
  return path.map((p, i) => (typeof p === 'number' ? `[${p}]` : `${i === 0 ? '' : '.'}${String(p)}`)).join('');
}

/**
 * One issue as lines. An unknown field is named with its own path. A union that matched no
 * branch reports the branch that came closest: the one whose problems are not just "this is
 * the wrong kind of value", and of those the one with fewest; when every branch is the wrong
 * kind, the union's own message says what is allowed.
 */
function describe(issue: Issue, at: readonly PropertyKey[] = []): { path: string; message: string }[] {
  const path = [...at, ...issue.path];
  if (issue.code === 'unrecognized_keys') {
    return issue.keys.map((key) => ({ path: formatPath([...path, key]), message: `unknown field "${key}"` }));
  }
  if (issue.code === 'invalid_union' && issue.errors.length > 0) {
    const wrongKind = (branch: Issue[]) => branch.length === 1 && branch[0].path.length === 0 && (branch[0].code === 'invalid_type' || branch[0].code === 'invalid_value');
    const closest = issue.errors.filter((b) => !wrongKind(b)).sort((a, b) => a.length - b.length)[0];
    if (closest) return closest.flatMap((nested) => describe(nested, path));
  }
  return [{ path: formatPath(path), message: issue.message }];
}

/**
 * Validates the parsed files of content/, keyed by their path under content/ ("course.yaml",
 * "modules/00.yaml", "fridge/one-shot.yaml"), and returns the typed course. Throws a
 * ContentError naming every problem.
 */
export function validateContent(files: Readonly<Record<string, unknown>>): Course {
  const problems: string[] = [];
  const problem = (file: string, path: string, message: string) => problems.push(`content/${file}${path ? ` ${path}` : ''}: ${message}`);

  function parse<T>(schema: z.ZodType<T>, file: string): T | undefined {
    const result = schema.safeParse(files[file]);
    if (result.success) return result.data;
    for (const issue of result.error.issues) for (const d of describe(issue)) problem(file, d.path, d.message);
    return undefined;
  }

  const fridges: Record<string, Fridge> = {};
  const fridgeNames = new Set<string>();
  for (const file of Object.keys(files)) {
    const name = /^fridge\/(.+)\.yaml$/.exec(file)?.[1];
    if (name === undefined) continue;
    if (!slugPattern.test(name)) problem(file, '', 'a fridge file name must be lower-case letters, digits and hyphens');
    fridgeNames.add(name);
    const fridge = parse(fridgeFile, file);
    if (fridge) fridges[name] = fridge;
  }

  const moduleFiles: Record<string, ModuleFile> = {};
  for (const file of Object.keys(files)) {
    if (!file.startsWith('modules/')) continue;
    const module = parse(moduleFile, file);
    if (!module) continue;
    moduleFiles[file] = module;
    module.screens.forEach((screen, j) => {
      const refs = screen.type === 'fridge' ? { fridge: screen.fridge } : screen.type === 'compare' ? { left: screen.left, right: screen.right } : {};
      for (const [field, name] of Object.entries(refs)) {
        if (!fridgeNames.has(name)) problem(file, `screens[${j}].${field}`, `there is no fridge "${name}" (content/fridge/${name}.yaml)`);
      }
    });
  }

  if (!('course.yaml' in files)) problem('course.yaml', '', 'is missing');
  const course = parse(courseFile, 'course.yaml');
  if (!course) throw new ContentError(problems);

  const modules: Module[] = [];
  course.modules.forEach((entry, i) => {
    if (!(entry.file in files)) problem('course.yaml', `modules[${i}].file`, `content/${entry.file} does not exist`);
    const module = moduleFiles[entry.file];
    if (!module) return;
    if (module.slug !== entry.slug) problem(entry.file, 'slug', `is "${module.slug}", but course.yaml lists this file as module "${entry.slug}"`);
    modules.push({ ...entry, screens: module.screens });
  });

  const listed = new Set(course.modules.map((m) => m.file));
  for (const file of Object.keys(files)) {
    if (file.startsWith('modules/') && !listed.has(file)) problem(file, '', 'is not listed in course.yaml modules');
  }

  if (problems.length > 0) throw new ContentError(problems);
  return { ...course, modules, fridges };
}
