import { Abortable } from 'node:events';

import { Context, Effect, pipe } from 'effect';
import * as Layer from 'effect/Layer';
import * as NFS from 'fs';
import * as memfs from 'memfs';
import path from 'path';

import * as Process from '../process/process.js';
import {
  MkDirError,
  ReadFileError,
  StatError,
  WriteFileError,
} from './error.js';

export interface FS {
  writeFile: typeof NFS.writeFile;
  readFile: typeof NFS.readFile;
  mkdir: typeof NFS.mkdir;
  stat: typeof NFS.stat;
  open: typeof NFS.open;
  close: typeof NFS.close;
}

export const FS = Context.Tag<FS>();
export const FSLive = NFS;
export const FSMock = memfs.fs as unknown as typeof NFS;

export const getFS = (test: boolean) => {
  return test ? FS.of(FSMock) : FS.of(FSLive);
};

export const layer = (test = false) =>
  Layer.scoped(FS, Effect.succeed(getFS(test)));

export const writeFile = (
  file: NFS.PathOrFileDescriptor,
  data: string | NodeJS.ArrayBufferView,
  options: NFS.WriteFileOptions,
) =>
  FS.pipe(
    Effect.flatMap(fs =>
      Effect.async<FS, WriteFileError, NFS.PathOrFileDescriptor>(resume => {
        fs.writeFile(file, data, options, error => {
          if (error) {
            resume(
              Effect.fail(new WriteFileError({ file, data, options, error })),
            );
          } else {
            resume(Effect.succeed(file));
          }
        });
      }),
    ),
  );

export const writeFileWithDir = (
  pathName: string,
  data: string | NodeJS.ArrayBufferView,
  options: NFS.WriteFileOptions,
): Effect.Effect<FS, WriteFileError | MkDirError, NFS.PathOrFileDescriptor> =>
  pipe(
    mkdir(path.dirname(pathName), { recursive: true }),
    Effect.flatMap(() => writeFile(pathName, data, options)),
  );

export const readFile = (
  path: NFS.PathOrFileDescriptor,
  options?:
    | ({ encoding?: BufferEncoding; flag?: string } & Abortable)
    | undefined
    | null,
): Effect.Effect<FS, ReadFileError, string | Buffer> =>
  FS.pipe(
    Effect.flatMap(fs =>
      Effect.async<FS, ReadFileError, string | Buffer>(resume => {
        fs.readFile(path, options, (error, data) => {
          if (error) {
            resume(Effect.fail(new ReadFileError({ path, options, error })));
          } else {
            resume(Effect.succeed(data));
          }
        });
      }),
    ),
  );

export const mkdir = (
  file: NFS.PathLike,
  options: NFS.MakeDirectoryOptions & {
    recursive: boolean;
  } = {
    recursive: false,
  },
): Effect.Effect<FS, MkDirError, string | undefined> =>
  FS.pipe(
    Effect.flatMap(fs =>
      Effect.async<FS, MkDirError, string | undefined>(resume => {
        fs.mkdir(file, options, (error, data) => {
          if (error) {
            resume(Effect.fail(new MkDirError({ file, options, error })));
          } else {
            resume(Effect.succeed(data));
          }
        });
      }),
    ),
  );

export const stat = (path: string) =>
  FS.pipe(
    Effect.flatMap(fs =>
      Effect.async<FS, StatError, NFS.Stats>(resume => {
        fs.stat(path, (error, stats) => {
          if (error) {
            resume(Effect.fail(new StatError({ path, error })));
          } else {
            resume(Effect.succeed(stats));
          }
        });
      }),
    ),
  );

export const isFileOrDirectory = (
  pathLike: string,
): Effect.Effect<FS, StatError, boolean> =>
  pipe(
    stat(pathLike),
    Effect.map(_ => _.isFile() || _.isDirectory()),
  );

export const isFile = (
  pathLike: string,
): Effect.Effect<FS, StatError, boolean> =>
  pipe(
    stat(pathLike),
    Effect.map(_ => _.isFile()),
  );

export const isDirectory = (
  pathLike: string,
): Effect.Effect<FS, StatError, boolean> =>
  pipe(
    stat(pathLike),
    Effect.map(_ => _.isDirectory()),
  );

// export const open = (
//   path: PathLike,
//   flags: OpenMode | undefined,
//   mode: Mode | undefined | null
// ): Effect.Effect<FS, OpenError, number> =>
//   pipe(
//     FS,
//     Effect.flatMap(fs =>
//       Effect.async<FS, OpenError, number>(resume =>
//         fs.open(path, flags, mode, (error, fd) => {
//           if (error) {
//             resume(Effect.fail(new OpenError({ path, flags, mode, error })));
//           } else {
//             resume(Effect.succeed(fd));
//           }
//         })
//       )
//     )
//   );

// export const close = (fd: number): Effect.Effect<FS, CloseError, number> =>
//   pipe(
//     FS,
//     Effect.flatMap(fs =>
//       Effect.async<FS, CloseError, number>(resume =>
//         fs.close(fd, error => {
//           if (error) {
//             resume(Effect.fail(new CloseError({ error, fd })));
//           } else {
//             resume(Effect.succeed(fd));
//           }
//         })
//       )
//     )
//   );

export const createConfigPathAbsolute = (filePath: string) =>
  Effect.gen(function* ($) {
    const process = yield* $(Process.Process);

    const onAbsolutePath = () =>
      Effect.if(isFile(filePath), {
        onTrue: Effect.succeed(filePath),
        // absolute directory, so set the filePath to default location
        // TODO: use search from cosmic config to handle this
        onFalse: Effect.succeed(path.join(process.cwd(), 'scribe.config.ts')),
      });

    return yield* $(
      path.isAbsolute(filePath),
      Effect.if({
        onTrue: onAbsolutePath(),
        onFalse: Effect.succeed(path.join(process.cwd(), filePath)),
      }),
    );
  });
