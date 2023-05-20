import { Effect, pipe } from '@scribe/core';
import * as NFS from 'fs';
import { ErrnoError } from './error';
import { Abortable } from 'node:events';
import path from 'path';

export const writeFile = (
  pathName: string,
  data: string | NodeJS.ArrayBufferView,
  options: NFS.WriteFileOptions
) =>
  Effect.async<never, ErrnoError, string>(resume => {
    NFS.writeFile(pathName, data, options, error => {
      if (error) {
        resume(Effect.fail(new ErrnoError({ error })));
      } else {
        resume(Effect.succeed(pathName));
      }
    });
  });

export const writeFileWithDir = (
  pathName: string,
  data: string | NodeJS.ArrayBufferView,
  options: NFS.WriteFileOptions
) =>
  pipe(
    mkdir(path.dirname(pathName), { recursive: true }),
    Effect.flatMap(() => writeFile(pathName, data, options))
  );

export const readFile = (
  path: NFS.PathOrFileDescriptor,
  options:
    | ({
        encoding?: BufferEncoding;
        flag?: string | undefined;
      } & Abortable)
    | undefined
    | null
) =>
  Effect.async<never, ErrnoError, string | Buffer>(resume => {
    NFS.readFile(path, options, (error, data) => {
      if (error) {
        resume(Effect.fail(new ErrnoError({ error })));
      } else {
        resume(Effect.succeed(data));
      }
    });
  });

export const mkdir = (
  path: NFS.PathLike,
  options: NFS.MakeDirectoryOptions & {
    recursive: true;
  }
) =>
  Effect.async<never, ErrnoError, string | undefined>(resume => {
    NFS.mkdir(path, options, (error, data) => {
      if (error) {
        resume(Effect.fail(new ErrnoError({ error })));
      } else {
        resume(Effect.succeed(data));
      }
    });
  });

export const stat = (
  filePath: string
): Effect.Effect<never, ErrnoError, NFS.Stats> =>
  Effect.async(resume =>
    NFS.stat(filePath, (error, stats) => {
      if (error) {
        resume(Effect.fail(new ErrnoError({ error })));
      } else {
        resume(Effect.succeed(stats));
      }
    })
  );

export const fileOrDirExists = (
  pathLike: string
): Effect.Effect<never, ErrnoError, boolean> =>
  pipe(
    stat(pathLike),
    Effect.map(_ => _.isFile() || _.isDirectory())
  );
