import { Effect } from '@scribe/core';
import * as TF from 'template-file';

import { TemplateFileError } from './error';

export const render = (
  template: string,
  data: TF.Data,
): Effect.Effect<never, TemplateFileError, string> => {
  return Effect.tryCatch(
    () => TF.render(template, data),
    error => new TemplateFileError({ error }),
  );
};
