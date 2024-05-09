import { TreeFormatter } from '@effect/schema';
import { ParseError } from '@effect/schema/ParseResult';
import { Data } from 'effect';

// Cosmic Config loading errors
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

// Parsing with Schema
export class ConfigParseError extends Data.TaggedClass('ConfigParseError')<{
  readonly parseError: ParseError;
  readonly path: string;
}> {
  override toString() {
    console.log(this.parseError);
    return `⚠️ Config parsing error: '${this.path}' 
 ${TreeFormatter.formatIssue(this.parseError.error)}`;
  }
}
