import { S } from '@scribe/core';

const Template = S.struct({
  templateFileKey: S.string,
  output: S.struct({
    directory: S.string,
    fileName: S.string,
  }),
});

const TemplateSettings = S.struct({
  output: S.optional(
    S.struct({
      directory: S.optional(S.string),
    }),
  ),
  outputs: S.array(Template),
});

export const ScribeConfig = S.struct({
  options: S.optional(
    S.struct({
      rootOutDir: S.string,
      templatesDirectories: S.array(S.string),
    }),
  ),
  templates: S.record(S.string, TemplateSettings),
});
export type ScribeConfig = S.To<typeof ScribeConfig>;
