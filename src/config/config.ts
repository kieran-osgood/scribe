import { cosmiconfig } from 'cosmiconfig';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';
import { CosmiconfigResult } from 'cosmiconfig/dist/types';

import { Effect, flow, pipe, RA, S, T } from '@scribe/core';

import { ConfigParseError, CosmicConfigError } from './error';
import { ScribeConfig } from './schema';

export const getCosmicExplorer = () =>
  cosmiconfig('scribe', {
    loaders: { '.ts': TypeScriptLoader() },
  });

export const readConfig = (path: string) =>
  pipe(
    Effect.tryCatchPromise(
      // TODO: if path - load, !path - search
      () => getCosmicExplorer().load(path),
      _ =>
        new CosmicConfigError({
          error: `[read config failed] ${_}`,
        })
    ),
    Effect.flatMap(extractConfig),
    Effect.flatMap(S.parseEffect(ScribeConfig)),
    Effect.catchTag('ParseError', _ =>
      Effect.fail(new ConfigParseError({ errors: _.errors, path }))
    )
  );

export const checkForTemplates = (_: string[]) =>
  Effect.cond(
    () => RA.isNonEmptyArray(_),
    () => _,
    () =>
      new CosmicConfigError({
        error: 'No template options found',
      })
  );

/**
 * reads the config from readUserConfig and picks out the values
 * which are valid options
 */
export const readUserTemplateOptions = flow(
  readConfig,
  Effect.flatMap(config =>
    pipe(RA.fromRecord(config.templates), RA.map(T.getFirst), checkForTemplates)
  )
);

export const extractConfig = (_: CosmiconfigResult) =>
  Effect.cond(
    () => _ !== null && Boolean(_?.isEmpty) !== true,
    () => _?.config as unknown,
    () => new CosmicConfigError({ error: 'Empty Config' })
  );
