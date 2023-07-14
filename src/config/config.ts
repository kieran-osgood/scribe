import { Effect, flow, pipe, RA, S, T } from '@scribe/core';
import { cosmiconfig } from 'cosmiconfig';
import { CosmiconfigResult } from 'cosmiconfig/dist/types';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';

import PackageJson from '../../package.json';
import { ConfigParseError, CosmicConfigError } from './error';
import { ScribeConfig } from './schema';

export const getCosmicExplorer = () =>
  cosmiconfig(PackageJson.name, {
    loaders: {
      '.ts': TypeScriptLoader({ transpileOnly: true }),
    },
  });

export const readConfig = (path: string) =>
  pipe(
    Effect.tryCatchPromise(
      // TODO: if path - load, !path - search
      () => getCosmicExplorer().load(path),
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      _ => new CosmicConfigError({ error: `[read config failed] ${_}` }),
    ),
    Effect.flatMap(extractConfig),
    Effect.flatMap(S.parseEffect(ScribeConfig)),
    Effect.catchTag('ParseError', ({ errors }) =>
      Effect.fail(new ConfigParseError({ errors, path })),
    ),
  );

export const checkForTemplates = (_: string[]) =>
  Effect.cond(
    () => RA.isNonEmptyArray(_),
    () => _,
    () => new CosmicConfigError({ error: 'No template options found' }),
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
      RA.map(T.getFirst),
      checkForTemplates,
    ),
  ),
);

const isCosmicConfigResultSuccess = (_: CosmiconfigResult) =>
  _ !== null && _.isEmpty !== true;

export const extractConfig = (_: CosmiconfigResult) =>
  Effect.cond(
    () => isCosmicConfigResultSuccess(_),
    () => _?.config as unknown,
    () => new CosmicConfigError({ error: 'Empty Config' }),
  );
