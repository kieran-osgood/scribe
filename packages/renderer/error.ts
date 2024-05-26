import { Data } from 'effect';

export class TemplateFileError extends Data.TaggedClass('TemplateFileError')<{
  readonly error?: unknown;
}> {
  override toString(): string {
    return 'Writing to file failed, please report this.';
  }
}

export class GetTemplateError extends Data.TaggedClass('GetTemplateError')<{
  readonly cause?: string;
}> {}
