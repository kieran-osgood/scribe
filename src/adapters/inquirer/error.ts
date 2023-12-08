import { Data } from 'effect';

export class PromptError extends Data.TaggedClass('PromptError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {
  override toString = () => this.message;
}
