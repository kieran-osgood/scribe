import { FileSystem } from '@effect/platform';
import { WriteFileOptions } from '@effect/platform/FileSystem';
import * as Process from '@scribe/process';
import { Effect, pipe } from 'effect';
import path from 'path';

export const writeFileWithDir = (
  pathName: string,
  data: string,
  options?: WriteFileOptions,
) =>
  FileSystem.FileSystem.pipe(
    Effect.flatMap(fs =>
      pipe(
        fs.makeDirectory(path.dirname(pathName), { recursive: true }),
        Effect.flatMap(() => fs.writeFileString(pathName, data, options)),
        Effect.map(() => pathName),
      ),
    ),
  );

export const isFileOrDirectory = (pathLike: string) =>
  FileSystem.FileSystem.pipe(
    Effect.flatMap(fs => fs.stat(pathLike)),
    Effect.map(_ => _.type === 'File' || _.type === 'Directory'),
  );

export const isFile = (pathLike: string) =>
  FileSystem.FileSystem.pipe(
    Effect.flatMap(fs => fs.stat(pathLike)),
    Effect.map(_ => _.type === 'File'),
  );

export const isDirectory = (pathLike: string) =>
  FileSystem.FileSystem.pipe(
    Effect.flatMap(fs => fs.stat(pathLike)),
    Effect.map(_ => _.type === 'Directory'),
  );

export const createConfigPathAbsolute = (filePath: string) =>
  Effect.gen(function* ($) {
    const process = yield* $(Process.Process);

    const onAbsolutePath = () =>
      Effect.if(isFile(filePath), {
        onTrue: () => Effect.succeed(filePath),
        // absolute directory, so set the filePath to default location
        // TODO: use search from cosmic config to handle this
        onFalse: () =>
          Effect.succeed(path.join(process.cwd(), 'scribe.config.ts')),
      });

    return yield* $(
      path.isAbsolute(filePath),
      Effect.if({
        onTrue: () => onAbsolutePath(),
        onFalse: () => Effect.succeed(path.join(process.cwd(), filePath)),
      }),
    );
  });
