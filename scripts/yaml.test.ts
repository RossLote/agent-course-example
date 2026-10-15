import { describe, expect, it } from 'vitest';
import { parseYaml, yamlContent } from './yaml.ts';

const file = '/repo/content/modules/03.yaml';

/** The plugin's transform as Vite calls it, with `this.error` throwing what it is given. */
function transform(source: string, id: string): unknown {
  const plugin = yamlContent();
  const hook = plugin.transform;
  if (typeof hook !== 'function') throw new Error('the plugin has no transform');
  const context = {
    error(message: string): never {
      throw new Error(message);
    },
  };
  return Reflect.apply(hook, context, [source, id]);
}

describe('the YAML parse for content/', () => {
  it('fails a key written twice, naming the file', () => {
    expect(() => parseYaml('heading: One\nheading: Two\n', file)).toThrow(/^\/repo\/content\/modules\/03\.yaml: .*unique/i);
  });

  it('keeps no, yes, on and off as strings (YAML 1.2 core schema)', () => {
    expect(parseYaml('a: no\nb: yes\nc: on\nd: off\ne: true\nf: 3\n', file)).toEqual({ a: 'no', b: 'yes', c: 'on', d: 'off', e: true, f: 3 });
  });

  it('fails a syntax error, naming the file', () => {
    expect(() => parseYaml('heading: "unclosed\n', file)).toThrow(/^\/repo\/content\/modules\/03\.yaml: /);
    expect(() => parseYaml('screens:\n  - a\n b: c\n', file)).toThrow(/^\/repo\/content\/modules\/03\.yaml: /);
  });

  it('is what the Vite plugin turns each .yaml file into, and its errors name the file', () => {
    expect(transform('answer: no\n', file)).toEqual({ code: 'export default {"answer":"no"};', map: null });
    expect(transform('export const x = 1;', '/repo/src/x.ts')).toBeNull();
    expect(() => transform('heading: One\nheading: Two\n', file)).toThrow(/^\/repo\/content\/modules\/03\.yaml: /);
  });
});
