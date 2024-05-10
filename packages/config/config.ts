import { Schema } from '@effect/schema';
import { cosmiconfig, CosmiconfigResult } from 'cosmiconfig';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';
import { Array, Effect, flow, pipe, Tuple } from 'effect';

import PackageJson from '../../package.json';
import { ConfigParseError, CosmicConfigError } from './error.js';
import { ScribeConfig } from './schema.js';

export const getCosmicExplorer = () =>
  cosmiconfig(PackageJson.name, { loaders: { '.ts': TypeScriptLoader() } });

export const readConfig = (
  path: string,
): Effect.Effect<
  Schema.Schema.Type<typeof ScribeConfig>,
  CosmicConfigError | ConfigParseError
> =>
  pipe(
    Effect.tryPromise({
      try:
        // TODO: if path - load, !path - search
        async () => getCosmicExplorer().load(path),
      catch: _ =>
        new CosmicConfigError({ error: `[read config failed] ${String(_)}` }),
    }),
    Effect.flatMap(mapCosmicConfig),
    Effect.flatMap(Schema.decodeUnknown(ScribeConfig)),
    Effect.catchTags({
      ParseError: parseError =>
        Effect.fail(new ConfigParseError({ parseError, path })),
    }),
  );

export const checkForTemplates = (_: string[]) =>
  Effect.if({
    onTrue: () => Effect.succeed(_),
    onFalse: () =>
      Effect.fail(
        new CosmicConfigError({ error: 'No template options found' }),
      ),
  })(Array.isNonEmptyArray(_));

/**
 * reads the config from readUserConfig and picks out the values
 * which are valid options
 */
export const readUserTemplateOptions = flow(
  readConfig,
  Effect.flatMap(config =>
    pipe(
      Array.fromRecord(config.templates),
      Array.map(Tuple.getFirst),
      checkForTemplates,
    ),
  ),
);

const isCosmicConfigResultSuccess = (_: CosmiconfigResult) =>
  _ !== null && _.isEmpty !== true;

export const mapCosmicConfig = (_: CosmiconfigResult) =>
  Effect.if({
    onTrue: () => Effect.succeed(_?.config as unknown),
    onFalse: () =>
      Effect.fail(new CosmicConfigError({ error: 'Empty Config' })),
  })(isCosmicConfigResultSuccess(_));
