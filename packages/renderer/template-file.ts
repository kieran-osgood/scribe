import { Effect } from 'effect';
import * as TF from 'template-file';

import { TemplateFileError } from './error.js';

// TODO: Add tests
export const render = (
  template: string,
  data: TF.Data,
): Effect.Effect<string, TemplateFileError> => {
  return Effect.try({
    try: () => TF.render(template, data),
    catch: error => new TemplateFileError({ error }),
  });
};
