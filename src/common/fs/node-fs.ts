import { Effect, pipe } from '@scribe/core';
import * as FS from 'fs';
import { ErrnoError } from './error';
import { Abortable } from 'node:events';
import path from 'path';

export const writeFile = (
  pathName: string,
  data: string | NodeJS.ArrayBufferView,
  options: FS.WriteFileOptions
) =>
  Effect.async<never, ErrnoError, boolean>(resume => {
    FS.writeFile(pathName, data, options, err => {
      if (err) {
        resume(Effect.fail(new ErrnoError(err)));
      } else {
        resume(Effect.succeed(true));
      }
    });
  });

export const writeFileWithDir = (
  pathName: string,
  data: string | NodeJS.ArrayBufferView,
  options: FS.WriteFileOptions
) =>
  pipe(
    mkdir(path.dirname(pathName), { recursive: true }),
    Effect.flatMap(() => writeFile(pathName, data, options))
  );

export const readFile = (
  path: FS.PathOrFileDescriptor,
  options:
    | ({
        encoding?: BufferEncoding;
        flag?: string | undefined;
      } & Abortable)
    | undefined
    | null
) =>
  Effect.async<never, ErrnoError, string | Buffer>(resume => {
    FS.readFile(path, options, (err, data) => {
      if (err) {
        resume(Effect.fail(new ErrnoError(err)));
      } else {
        resume(Effect.succeed(data));
      }
    });
  });

export const mkdir = (
  path: FS.PathLike,
  options: FS.MakeDirectoryOptions & {
    recursive: true;
  }
) =>
  Effect.async<never, ErrnoError, string | undefined>(resume => {
    FS.mkdir(path, options, (err, data) => {
      if (err) {
        resume(Effect.fail(new ErrnoError(err)));
      } else {
        resume(Effect.succeed(data));
      }
    });
  });
