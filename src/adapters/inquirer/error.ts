import { TaggedClass } from '@scribe/core';

export class PromptError extends TaggedClass('PromptError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {
  override toString = () => this.message;
}
