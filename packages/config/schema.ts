import * as S from '@effect/schema/Schema';

const GeneratorConfig = S.Struct({
  templateFileKey: S.String,
  output: S.Struct({
    directory: S.String,
    fileName: S.String,
  }),
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
  generators: S.Record(S.String, S.Array(GeneratorConfig)),
});
export type ScribeConfig = S.Schema.Type<typeof ScribeConfig>;
