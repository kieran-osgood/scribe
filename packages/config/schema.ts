import * as S from '@effect/schema/Schema';

const GeneratorConfig = S.Struct({
  /**
   *
   */
  key: S.String,
  /**
   * Output directory for generation.
   * This will be joined with the `fileName` specified
   */
  // TODO: Allow replacement via mustache too
  directory: S.String,
  /**
   * Output fileName - this will format via a mustache template too
   * @example
   * `{{Key}}.tsx`
   */
  fileName: S.String,

  // TODO: implement any vars to be passed in
  // variables: S.Record(S.String, S.String)
});

export type GeneratorConfig = S.Schema.Type<typeof GeneratorConfig>;

export const ScribeConfig = S.Struct({
  /**
   * List of directories to discover `*.scribe` generator files
   */
  templatesDirectories: S.Array(S.String),
  /**
   * Map of Generators.
   * Each Map Key will be used to identify it within the CLI.
   */
  generators: S.Record(S.String, S.Array(GeneratorConfig)),
});
export type ScribeConfig = S.Schema.Type<typeof ScribeConfig>;
