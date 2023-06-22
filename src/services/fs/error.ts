import { Data } from 'src/core';
import * as fs from 'fs';
import NFS from 'fs';
import { Abortable } from 'node:events';

export const tagName = <K extends string>(k: K) =>
  `@scribe/core/fs/${k}` as const;

export const FSError = <K extends string>(k: K) => Data.TaggedClass(tagName(k));

export class FileNotFoundError extends FSError('FileNotFoundError')<{
  readonly filePath: string;
}> {}

export class OpenError extends FSError('OpenError')<{
  readonly error: NodeJS.ErrnoException;
  readonly path: NFS.PathLike;
  readonly flags: NFS.OpenMode | undefined;
  readonly mode: NFS.Mode | undefined | null;
}> {}

export class CloseError extends FSError('CloseError')<{
  readonly error: NodeJS.ErrnoException;
  readonly fd: number;
}> {}

export class WriteFileError extends FSError('WriteFileError')<{
  readonly error: NodeJS.ErrnoException;
  readonly file: fs.PathOrFileDescriptor;
  readonly data: string | NodeJS.ArrayBufferView;
  readonly options: fs.WriteFileOptions;
}> {}

export class ReadFileError extends FSError('ReadFileError')<{
  readonly error: NodeJS.ErrnoException;
  readonly path: fs.PathOrFileDescriptor;
  readonly options:
    | ({
        encoding?: BufferEncoding;
        flag?: string | undefined;
      } & Abortable)
    | undefined
    | null;
}> {}

export class MkDirError extends FSError('MkDirError')<{
  readonly error: NodeJS.ErrnoException;
  readonly file: NFS.PathLike;
  readonly options?: NFS.MakeDirectoryOptions & {
    recursive: true;
  };
}> {}

export class StatError extends FSError('StatError')<{
  readonly error: NodeJS.ErrnoException;
  readonly path: fs.PathLike;
}> {}

export class AccessError extends FSError('AccessError')<{
  readonly error: NodeJS.ErrnoException;
  readonly path: fs.PathLike;
  readonly mode: number | undefined;
}> {}

export class RmError extends FSError('RmError')<{
  readonly error: NodeJS.ErrnoException;
  readonly path: fs.PathLike;
  readonly options: fs.RmOptions | undefined;
}> {}

export class RmDirError extends FSError('RmDirError')<{
  readonly error: NodeJS.ErrnoException;
  readonly path: fs.PathLike;
  readonly options: fs.RmDirOptions | undefined;
}> {}

export class FileExistsError extends FSError('FileExistsError')<{
  readonly error: AccessError;
}> {}
