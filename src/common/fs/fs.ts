import { Effect } from '@scribe/core';
import * as NFS from 'fs';
import { ErrnoError } from './error';

export const writeFile = (
  path: NFS.PathOrFileDescriptor,
  data: string | NodeJS.ArrayBufferView,
  options: NFS.WriteFileOptions
) =>
  Effect.async<never, ErrnoError, boolean>(resume => {
    NFS.writeFile(path, data, options, err => {
      if (err) {
        resume(Effect.fail(new ErrnoError(err)));
      } else {
        resume(Effect.succeed(true));
      }
    });
  });
