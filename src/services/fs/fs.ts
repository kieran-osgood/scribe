import { FileSystem } from '@effect/platform';
import { WriteFileStringOptions } from '@effect/platform/FileSystem';
import { NodeFileSystem } from '@effect/platform-node';
import { Context, Effect, pipe } from 'effect';
import * as NFS from 'fs';
import path from 'path';

import * as Process from '../process/process.js';
import { MkDirError, WriteFileError } from './error.js';
import * as FSMock from './fs-mock.js';

export interface FS extends FileSystem.FileSystem {
  writeFileWithDir: (
    pathName: string,
    data: string | NodeJS.ArrayBufferView,
    options: NFS.WriteFileOptions,
  ) => Effect.Effect<
    NFS.PathOrFileDescriptor,
    WriteFileError | MkDirError,
    FileSystem.FileSystem
  >;
}

export const FS = Context.GenericTag<FileSystem.FileSystem, FS>(
  '@effect/platform/FileSystem',
);

export const layer = (test = false) =>
  test ? FSMock.layer : NodeFileSystem.layer;

export const writeFileWithDir = (
  pathName: string,
  data: string | NodeJS.ArrayBufferView,
  options?: WriteFileStringOptions,
) =>
  pipe(
    FS,
    Effect.flatMap(fs =>
      pipe(
        fs.makeDirectory(path.dirname(pathName), { recursive: true }),
        Effect.flatMap(() =>
          fs.writeFileString(pathName, String(data), options),
        ),
      ),
    ),
  );

export const createConfigPathAbsolute = (filePath: string) =>
  Effect.gen(function* () {
    const process = yield* Process.Process;

    const onAbsolutePath = () =>
      Effect.if(isFile(filePath), {
        onTrue: () => Effect.succeed(filePath),
        // absolute directory, so set the filePath to default location
        // TODO: use search from cosmic config to handle this
        onFalse: () =>
          Effect.succeed(path.join(process.cwd(), 'scribe.config.ts')),
      });

    return yield* pipe(
      path.isAbsolute(filePath),
      Effect.if({
        onTrue: () => onAbsolutePath(),
        onFalse: () => Effect.succeed(path.join(process.cwd(), filePath)),
      }),
    );
  });

export const isFile = (pathLike: string) =>
  pipe(
    FS,
    Effect.flatMap(fs => fs.stat(pathLike)),
    Effect.map(_ => _.type === 'File'),
  );

export const isDirectory = (pathLike: string) =>
  pipe(
    FS,
    Effect.flatMap(fs => fs.stat(pathLike)),
    Effect.map(_ => _.type === 'Directory'),
  );

export const isFileOrDirectory = (pathLike: string) =>
  pipe(
    FS,
    Effect.flatMap(fs => fs.stat(pathLike)),
    Effect.map(_ => _.type === 'Directory' || _.type === 'File'),
  );
