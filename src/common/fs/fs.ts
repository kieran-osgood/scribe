import * as NFS from 'fs';
import path from 'path';
import { MkDirError, ReadFileError, StatError, WriteFileError } from './error';
import { Abortable } from 'node:events';
import { Context, Effect, pipe } from '@scribe/core';

export interface FS {
  writeFile: typeof NFS.writeFile;
  readFile: typeof NFS.readFile;
  mkdir: typeof NFS.mkdir;
  stat: typeof NFS.stat;
}

export const FS = Context.Tag<FS>();
export const FSLive = Context.make(FS, NFS);
export const writeFile = (
  file: NFS.PathOrFileDescriptor,
  data: string | NodeJS.ArrayBufferView,
  options: NFS.WriteFileOptions
) =>
  pipe(
    FS,
    Effect.flatMap(fs =>
      Effect.async<FS, WriteFileError, NFS.PathOrFileDescriptor>(resume => {
        fs.writeFile(file, data, options, error => {
          if (error) {
            resume(
              Effect.fail(new WriteFileError({ file, data, options, error }))
            );
          } else {
            resume(Effect.succeed(file));
          }
        });
      })
    )
  );

export const writeFileWithDir = (
  pathName: string,
  data: string | NodeJS.ArrayBufferView,
  options: NFS.WriteFileOptions
): Effect.Effect<FS, WriteFileError | MkDirError, NFS.PathOrFileDescriptor> =>
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
  pipe(
    FS,
    Effect.flatMap(fs =>
      Effect.async<FS, ReadFileError, string | Buffer>(resume => {
        fs.readFile(path, options, (error, data) => {
          if (error) {
            resume(Effect.fail(new ReadFileError({ path, options, error })));
          } else {
            resume(Effect.succeed(data));
          }
        });
      })
    )
  );

export const mkdir = (
  file: NFS.PathLike,
  options: NFS.MakeDirectoryOptions & {
    recursive: true;
  }
) =>
  pipe(
    FS,
    Effect.flatMap(fs =>
      Effect.async<FS, MkDirError, string | undefined>(resume => {
        fs.mkdir(file, options, (error, data) => {
          if (error) {
            resume(Effect.fail(new MkDirError({ file, options, error })));
          } else {
            resume(Effect.succeed(data));
          }
        });
      })
    )
  );

export const stat = (path: string) =>
  pipe(
    FS,
    Effect.flatMap(fs =>
      Effect.async<FS, StatError, NFS.Stats>(resume =>
        fs.stat(path, (error, stats) => {
          if (error) {
            resume(Effect.fail(new StatError({ path, error })));
          } else {
            resume(Effect.succeed(stats));
          }
        })
      )
    )
  );

export const fileOrDirExists = (
  pathLike: string
): Effect.Effect<FS, StatError, boolean> =>
  pipe(
    stat(pathLike),
    Effect.map(_ => _.isFile() || _.isDirectory())
  );
