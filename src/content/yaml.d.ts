// A YAML file imports as its parsed data (the plugin in vite.config.ts). It is unknown until
// src/content/ validates it.
declare module '*.yaml' {
  const data: unknown;
  export default data;
}
