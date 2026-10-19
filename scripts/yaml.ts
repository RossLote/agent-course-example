// The one YAML parse for content/: the Vite plugin that turns each imported .yaml file into a
// module at build time (vite.config.ts) and readContent on Node (scripts/content.ts) both parse
// with it, so the app and the packaging script and e2e specs read the same data.
import type { Plugin } from 'vite';
import { parse, type DocumentOptions, type ParseOptions, type SchemaOptions } from 'yaml';

/**
 * YAML 1.2 core schema, written out rather than left to the library's defaults: `no`, `yes`
 * and `on` stay strings, and a key written twice is an error, not a silent overwrite.
 */
export const YAML_OPTIONS = {
  version: '1.2',
  schema: 'core',
  uniqueKeys: true,
  prettyErrors: true,
} as const satisfies ParseOptions & DocumentOptions & SchemaOptions;

/** A YAML file's data; a syntax error or a duplicated key throws an Error that names `file`. */
export function parseYaml(source: string, file: string): unknown {
  try {
    return parse(source, YAML_OPTIONS);
  } catch (error) {
    throw new Error(`${file}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
  }
}

/**
 * Parses each imported .yaml file at build time into a module exporting its data, so the
 * content reaches the bundle as JavaScript and nothing is fetched at run time.
 * src/content/ validates the data.
 */
export function yamlContent(): Plugin {
  return {
    name: 'yaml-content',
    transform(source, id) {
      if (!/\.ya?ml$/.test(id)) return null;
      try {
        return { code: `export default ${JSON.stringify(parseYaml(source, id))};`, map: null };
      } catch (error) {
        this.error(error instanceof Error ? error.message : String(error));
      }
    },
  };
}
