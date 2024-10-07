import { ParseError } from '@effect/schema/ParseResult';
import { URLS } from '@scribe/constants';
import { Data } from 'effect';

export const CHECK_CONFIG_TIP = `Check your 'scribe.config.ts' and read the documentation for more information: ${URLS.github.readme}`;

// Cosmic Config loading errors
export class CosmicConfigError extends Data.TaggedClass('CosmicConfigError')<{
  readonly errorCode:
    | 'READ_FAILED'
    | 'COSMIC_CONFIG_CONSTRUCTOR_ERROR'
    | 'INVALID_CONFIG'
    | 'EMPTY_CONFIG'
    | 'MISSING_GENERATORS';
  message?: string | undefined;
}> {
  private userErrors: Record<Partial<typeof this.errorCode>, string> = {
    MISSING_GENERATORS: 'No Generators found.',
    INVALID_CONFIG: 'Invalid config.',
    EMPTY_CONFIG: 'Config is empty, have you exported?',
    READ_FAILED: 'Read failed, check permissions.',
    COSMIC_CONFIG_CONSTRUCTOR_ERROR:
      'Unexpected error, failed to construct searcher.',
  };

  override toString() {
    let errorMessage = `Config Read Error: ${this.userErrors[this.errorCode]}`;

    if (this.message) errorMessage += `\n${this.message}`;

    errorMessage += `\n${CHECK_CONFIG_TIP}`;

    return errorMessage;
  }
}

// Parsing with Schema
export class ConfigParseError extends Data.TaggedClass('ConfigParseError')<{
  readonly parseError: ParseError;
  readonly path: string;
}> {
  override toString() {
    return `⚠️ Config parsing error: '${this.path}' 
${this.parseError.message}`;
  }
}
// eslint: -32603: Request textDocument/diagnostic failed with message: Config (unnamed): Key "ignores": Expected array to only contain strings and functions at user-defined index 7.
