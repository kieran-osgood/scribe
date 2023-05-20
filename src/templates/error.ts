import { Data } from '@scribe/core';

export class TemplateFileError extends Data.TaggedClass('TemplateFileError')<{
  readonly cause?: unknown;
}> {
  override toString(): string {
    return 'Writing to file failed, please report this.';
  }
}
