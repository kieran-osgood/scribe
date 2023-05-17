import { Data } from '../common/core';

export class CosmicConfigError extends Data.TaggedClass('CosmicConfigError')<{
  readonly error:
    | `[read config failed] ${string}`
    | 'invalid config'
    | 'Empty Config'
    | 'No template options found';
}> {}
