import { Schema } from '@effect/schema';
import { cosmiconfig } from 'cosmiconfig';
import { CosmiconfigResult } from 'cosmiconfig/dist/types';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';
import { Effect, flow, pipe, ReadonlyArray, Tuple } from 'effect';

import PackageJson from '../../../package.json';
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
    Effect.tryPromise({
      try:
        // TODO: if path - load, !path - search
        async () => getCosmicExplorer().load(path),
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      catch: _ => new CosmicConfigError({ error: `[read config failed] ${_}` }),
    }),
    Effect.flatMap(extractConfig),
    Effect.flatMap(Schema.parse(ScribeConfig)),
    Effect.catchTag('ParseError', parseError =>
      Effect.fail(new ConfigParseError({ parseError, path })),
    ),
  );

export const checkForTemplates = (_: string[]) =>
  Effect.if({
    onTrue: Effect.succeed(_),
    onFalse: Effect.fail(
      new CosmicConfigError({ error: 'No template options found' }),
    ),
  })(ReadonlyArray.isNonEmptyArray(_));

/**
 * reads the config from readUserConfig and picks out the values
 * which are valid options
 */
export const readUserTemplateOptions = flow(
  readConfig,
  Effect.flatMap(config =>
    pipe(
      ReadonlyArray.fromRecord(config.templates),
      ReadonlyArray.map(Tuple.getFirst),
      checkForTemplates,
    ),
  ),
);

const isCosmicConfigResultSuccess = (_: CosmiconfigResult) =>
  _ !== null && _.isEmpty !== true;

export const extractConfig = (_: CosmiconfigResult) =>
  Effect.if({
    onTrue: Effect.succeed(_?.config as unknown),
    onFalse: Effect.fail(new CosmicConfigError({ error: 'Empty Config' })),
  })(isCosmicConfigResultSuccess(_));
