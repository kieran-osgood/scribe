import { S } from 'src/core';

const Template = S.struct({
  templateFileKey: S.string,
  output: S.struct({
    directory: S.string,
    fileName: S.string,
  }),
});

export type Template = S.To<typeof Template>;

const TemplateSettings = S.struct({
  output: S.optional(
    S.struct({
      directory: S.optional(S.string),
    }),
  ),
  outputs: S.array(Template),
});

export type TemplateSettings = S.To<typeof TemplateSettings>;

export const ScribeConfig = S.struct({
  /**
   * Global settings that apply to all template options
   * Overridable within templates
   */
  options: S.optional(
    S.struct({
      /**
       * Sets the root for pathing on relative paths
       */
      rootOutDir: S.string,
      /**
       * Directories to discover `*.scribe` files
       */
      templatesDirectories: S.array(S.string),
    }),
  ),
  /**
   * List of templates for the CLI to render
   */
  templates: S.record(S.string, TemplateSettings),
});
export type ScribeConfig = S.To<typeof ScribeConfig>;
