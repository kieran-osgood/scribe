import { cosmiconfig } from 'cosmiconfig';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';
import { flow, pipe } from '../common/core';
import * as Effect from '@effect/io/Effect';
import { TaggedClass } from '@effect/data/Data';
import { CosmiconfigResult } from 'cosmiconfig/dist/types';

class CosmicConfigError extends TaggedClass('CosmicConfigError')<{
  readonly error:
    | `[read config failed] ${string}`
    | 'invalid config'
    | 'Empty Config'
    | 'No template options found';
}> {}

const explorer = cosmiconfig('test', {
  loaders: { '.ts': TypeScriptLoader() },
});

const extractConfig = (_: CosmiconfigResult) =>
  Effect.cond(
    () => !!_?.isEmpty !== true,
    () => _?.config as ReadUserConfigValue,
    () => new CosmicConfigError({ error: 'Empty Config' as const })
  );

type ReadUserConfigValue = {
  templateOptions: Record<string, unknown>;
};
export const readConfig = (
  path: string
): Effect.Effect<never, CosmicConfigError, ReadUserConfigValue> =>
  pipe(
    Effect.tryCatchPromise(
      () => explorer.load(path),
      _ =>
        new CosmicConfigError({
          error: `[read config failed] ${_}` as const,
        })
    ),
    Effect.flatMap(extractConfig)
  );

/**
 * reads the config from readUserConfig and picks out the values
 * which are valid options
 */
export const readUserTemplateOptions = flow(
  readConfig,
  Effect.map(_ => Object.keys(_.templateOptions)),
  Effect.flatMap(_ =>
    Effect.cond(
      () => _.length > 0,
      () => _,
      () =>
        new CosmicConfigError({
          error: 'No template options found' as const,
        })
    )
  )
);
