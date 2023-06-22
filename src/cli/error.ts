import { TaggedClass } from 'src/core';

export class CliError extends TaggedClass('CliError')<{
  readonly cause?: unknown;
}> {}
