import { cosmiconfig } from 'cosmiconfig';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';

import { CosmiconfigResult } from 'cosmiconfig/dist/types';

import { Effect, flow, pipe, S, TF } from '@scribe/core';
import { CosmicConfigError } from './error';
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
const parse = (conf: unknown) =>
  Effect.mapError(S.parseEffect(ScribeConfig)(conf), e =>
    TF.formatErrors(e.errors)
  );
export const readConfig = (path: string) =>
  pipe(
    Effect.tryCatchPromise(
      () => getCosmicExplorer().load(path),
      _ =>
        new CosmicConfigError({
          error: `[read config failed] ${_}` as const,
        })
    ),
    Effect.flatMap(extractConfig),

    // Effect.tap(_ => Effect.log('Lets parse?')),
    Effect.flatMap(S.parseEffect(ScribeConfig)),
    Effect.catchTag('ParseError', _ => {
      console.log(`⚠️ Failed to read config: ${path}
${TF.formatErrors(_.errors)}
`);
      console.log();
      return Effect.fail(_);
    }),
    i => i
  );

/**
 * reads the config from readUserConfig and picks out the values
 * which are valid options
 */
export const readUserTemplateOptions = flow(
  readConfig,
  Effect.map(_ => Object.keys(_.templates)),
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
