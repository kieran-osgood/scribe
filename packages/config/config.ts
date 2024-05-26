import { FileSystem } from '@effect/platform';
import { Schema } from '@effect/schema';
import * as Constants from '@scribe/constants';
import * as FS from '@scribe/fs';
import * as Process from '@scribe/process';
import { cosmiconfig, CosmiconfigResult } from 'cosmiconfig';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';
import { Array, Effect, flow, pipe, Tuple } from 'effect';
import path from 'path';

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
      Array.fromRecord(config.generators),
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

export const createConfigPath = (_process: Process.Process) =>
  path.join(_process.cwd(), 'scribe.config.ts');

export const copyBaseScribeConfigToPath = () =>
  Effect.gen(function* ($) {
    const process = yield* $(Process.Process);
    const fs = yield* $(FileSystem.FileSystem);
    const path = createConfigPath(process);
    yield* $(fs.writeFileString(path, Constants.BASE_CONFIG));
    return path;
  });

export const createConfigFileExistsError = () =>
  Effect.gen(function* ($) {
    const _process = yield* $(Process.Process);
    const path = createConfigPath(_process);

    yield* $(
      Effect.fail(
        new FS.FileExistsError({
          error: new FS.AccessError({
            error: new Error(`${path} already exists.`),
            path,
            mode: 0,
          }),
        }),
      ),
    );
  });

export const checkConfigWritePathEmpty = () =>
  Process.Process.pipe(
    Effect.flatMap(_process =>
      pipe(
        createConfigPath(_process),
        FS.isFileOrDirectory,
        Effect.catchTag('SystemError', error => {
          /**
           * NotFound indicates the path is clear, and we can safely write there
           */
          if (error.reason === 'NotFound') {
            return Effect.succeed(false);
          }

          // TODO: add ignore file exists
          // TODO: test case that hits this?
          // Permission error?
          return Effect.fail(error);
        }),
        Effect.if({
          onTrue: () => createConfigFileExistsError(),
          onFalse: () => Effect.void,
        }),
      ),
    ),
  );
