import * as S from '@effect/schema/Schema';

const Template = S.Struct({
  templateFileKey: S.String,
  output: S.Struct({
    directory: S.String,
    fileName: S.String,
  }),
});

export type Template = S.Schema.Type<typeof Template>;

const GeneratorConfig = S.Struct({
  output: S.optional(
    S.Struct({
      directory: S.optional(S.String),
    }),
  ),
  outputs: S.Array(Template),
});

export type GeneratorConfig = S.Schema.Type<typeof GeneratorConfig>;

export const ScribeConfig = S.Struct({
  /**
   * Directories to discover `*.scribe` files
   */
  templatesDirectories: S.Array(S.String),
  /**
   * List of templates for the CLI to render
   */
  generators: S.Record(S.String, GeneratorConfig),
});
export type ScribeConfig = S.Schema.Type<typeof ScribeConfig>;
