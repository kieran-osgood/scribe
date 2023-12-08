import { Data } from 'effect';

export class CliError extends Data.TaggedClass('CliError')<{
  readonly cause?: unknown;
}> {}
