import { Schema as S } from '@effect/schema';

const Template = S.Struct({
  templateFileKey: S.String,
  output: S.Struct({
    directory: S.String,
    fileName: S.String,
  }),
});

export type Template = S.Schema.Type<typeof Template>;

const TemplateSettings = S.Struct({
  output: S.optional(
    S.Struct({
      directory: S.optional(S.String),
    }),
  ),
  outputs: S.Array(Template),
});

export type TemplateSettings = S.Schema.Type<typeof TemplateSettings>;

export const ScribeConfig = S.Struct({
  /**
   * Global settings that apply to all template options
   * Overridable within templates
   */
  options: S.optional(
    S.Struct({
      /**
       * Sets the root for pathing on relative paths
       */
      rootOutDir: S.String,
      /**
       * Directories to discover `*.scribe` files
       */
      templatesDirectories: S.Array(S.String),
    }),
  ),
  /**
   * List of templates for the CLI to render
   */
  templates: S.Record(S.String, TemplateSettings),
});

export type ScribeConfig = S.Schema.Type<typeof ScribeConfig>;
