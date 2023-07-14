import { NonEmptyReadonlyArray } from '@effect/data/ReadonlyArray';
import { ParseErrors } from '@effect/schema/src/ParseResult';
import { TaggedClass } from '@scribe/core';

import { TF } from '../core';

export class CosmicConfigError extends TaggedClass('CosmicConfigError')<{
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
