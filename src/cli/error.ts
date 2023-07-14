import { TaggedClass } from '@scribe/core';

export class CliError extends TaggedClass('CliError')<{
  readonly cause?: unknown;
}> {}
