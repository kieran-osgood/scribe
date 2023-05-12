import { Effect } from '@scribe/core';
import * as FSE from 'fs-extra';
import { ErrnoError } from './error';

export const writeFile = (
  path: string,
  data: string | NodeJS.ArrayBufferView,
  options: FSE.WriteFileOptions
) =>
  Effect.async<never, ErrnoError, boolean>(resume => {
    FSE.outputFile(path, data, options, err => {
      if (err) {
        resume(Effect.fail(new ErrnoError(err)));
      } else {
        resume(Effect.succeed(true));
      }
    });
  });
