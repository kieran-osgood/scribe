import { cosmiconfig } from 'cosmiconfig';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';
import { CosmiconfigResult } from 'cosmiconfig/dist/types';

import { Effect, flow, pipe, RA, S } from '@scribe/core';

import { ConfigParseError, CosmicConfigError } from './error';
import { ScribeConfig } from './schema';

const getCosmicExplorer = () =>
  cosmiconfig('test', {
    loaders: { '.ts': TypeScriptLoader() },
  });

const extractConfig = (_: CosmiconfigResult) =>
  Effect.cond(
    () => !!_?.isEmpty !== true,
    () => _?.config as unknown,
    () => new CosmicConfigError({ error: 'Empty Config' })
  );

export const readConfig = (path: string) =>
  pipe(
    Effect.tryCatchPromise(
      () => getCosmicExplorer().load(path),
      _ =>
        new CosmicConfigError({
          error: `[read config failed] ${_}`,
        })
    ),
    Effect.flatMap(
      flow(
        extractConfig, //
        S.parseEffect(ScribeConfig),
        Effect.catchTag('ParseError', _ =>
          Effect.fail(new ConfigParseError({ errors: _.errors, path }))
        )
      )
    )
  );
/**
 * reads the config from readUserConfig and picks out the values
 * which are valid options
 */
export const readUserTemplateOptions = flow(
  readConfig,
  Effect.flatMap(config =>
    pipe(
      RA.fromRecord(config.templates),
      RA.map(_ => _[0]),
      _ =>
        Effect.cond(
          () => _.length > 0,
          () => _,
          () =>
            new CosmicConfigError({
              error: 'No template options found',
            })
        )
    )
  )
);
