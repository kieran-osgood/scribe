import { Data } from '@scribe/core';

export class ErrnoError extends Data.TaggedClass('ErrnoError')<{
  readonly error: NodeJS.ErrnoException;
}> {}

export class FileNotFoundError extends Data.TaggedClass(
  'fs.FileNotFoundError'
)<{
  readonly filePath: string;
}> {}
