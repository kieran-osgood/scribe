import { TreeFormatter } from '@effect/schema';
import { ParseErrors } from '@effect/schema/ParseResult';
import { Data } from 'effect';
import { NonEmptyReadonlyArray } from 'effect/ReadonlyArray';

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

export class ConfigParseError extends Data.TaggedClass('ParseError')<{
  readonly errors: NonEmptyReadonlyArray<ParseErrors>;
  readonly path: string;
}> {
  override toString() {
    return `⚠️ Config parsing error: '${this.path}' 
 ${TreeFormatter.formatErrors(this.errors)}`;
  }
}
