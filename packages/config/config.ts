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

export const CONFIG_NAME = 'scribe.config.ts';

export const getCosmicExplorer = () =>
  Effect.try({
    try: () =>
      cosmiconfig(PackageJson.name, { loaders: { '.ts': TypeScriptLoader() } }),
    catch: () =>
      new CosmicConfigError({ error: 'Cosmic Explorer failed to construct' }),
  });

const load = (path: string) =>
  Effect.gen(function* ($) {
    const explorer = yield* $(getCosmicExplorer());

    return yield* $(
      Effect.tryPromise({
        try:
          // TODO: if path - load, !path - search
          async () => explorer.load(path),
        catch: _ =>
          new CosmicConfigError({ error: `[read config failed] ${String(_)}` }),
      }),
    );
  });

export const readConfig = (path: string) => {
  return pipe(
    load(path),
    Effect.flatMap(mapCosmicConfig),
    Effect.flatMap(Schema.decodeUnknown(ScribeConfig)),
    Effect.catchTags({
      ParseError: parseError =>
        Effect.fail(new ConfigParseError({ parseError, path })),
    }),
  );
};

export const checkForTemplates = (_: string[]) =>
  Effect.if(Array.isNonEmptyArray(_), {
    onTrue: () => Effect.succeed(_),
    onFalse: () =>
      Effect.fail(
        new CosmicConfigError({ error: 'No template options found' }),
      ),
  });

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
  Effect.if(isCosmicConfigResultSuccess(_), {
    onTrue: () => Effect.succeed(_?.config as unknown),
    onFalse: () =>
      Effect.fail(new CosmicConfigError({ error: 'Empty Config' })),
  });

export const getConfigPath = (cwd?: string) => {
  if (cwd) {
    return Effect.succeed(path.join(cwd, CONFIG_NAME));
  }

  return Process.Process.pipe(
    Effect.flatMap(_process =>
      Effect.succeed(path.join(_process.cwd(), CONFIG_NAME)),
    ),
  );
};

export const copyBaseScribeConfigToPath = () =>
  Effect.gen(function* ($) {
    const fs = yield* $(FileSystem.FileSystem);
    const path = yield* $(getConfigPath());
    yield* $(fs.writeFileString(path, Constants.BASE_CONFIG));
    return path;
  });

export const createConfigFileExistsError = () =>
  Effect.gen(function* ($) {
    const path = yield* $(getConfigPath());

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
  pipe(
    getConfigPath(),
    Effect.flatMap(FS.isFileOrDirectory),

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
  );

export const createConfigPathAbsolute = (filePath: string) =>
  Effect.gen(function* ($) {
    const _process = yield* $(Process.Process);
    const cwd = _process.cwd();

    return yield* $(
      path.isAbsolute(filePath),
      Effect.if({
        onTrue: () => onAbsolutePath(cwd, filePath),
        // Joins cwd with relative path argument
        onFalse: () => Effect.succeed(path.join(cwd, filePath)),
      }),
    );
  });

const onAbsolutePath = (cwd: string, filePath: string) =>
  Effect.if(FS.isFile(filePath), {
    onTrue: () => Effect.succeed(filePath),
    // absolute directory, so set the filePath to default location
    // TODO: use search from cosmic config to handle this
    onFalse: () => getConfigPath(cwd),
  });
