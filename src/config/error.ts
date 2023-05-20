import { Data, TF } from '../common/core';
import { TaggedClass } from '@scribe/core';
import { NonEmptyReadonlyArray } from '@effect/data/ReadonlyArray';
import { ParseErrors } from '@effect/schema/src/ParseResult';

export class CosmicConfigError extends Data.TaggedClass('CosmicConfigError')<{
  readonly error:
    | `[read config failed] ${string}`
    | 'invalid config'
    | 'Empty Config'
    | 'No template options found';
}> {
  override toString() {
    return `Config Read Error: ${this.error}`;
  }
}

export class ConfigParseError extends TaggedClass('ParseError')<{
  readonly errors: NonEmptyReadonlyArray<ParseErrors>;
  readonly path: string;
}> {
  override toString() {
    return `⚠️ Config parsing error: '${this.path}' 
 ${TF.formatErrors(this.errors)}`;
  }
}
