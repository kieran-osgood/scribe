import { Effect } from 'effect';

import { Data, render as tfrender } from '../../services/tf';
import { TemplateFileError } from './error';

export const render = (
  template: string,
  data: Data,
): Effect.Effect<never, TemplateFileError, string> => {
  return Effect.try({
    try: () => tfrender(template, data),
    catch: error => new TemplateFileError({ error }),
  });
};
