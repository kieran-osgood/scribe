import { Effect, pipe } from 'effect';

import {
  checkForTemplates,
  extractConfig,
  readConfig,
  readUserTemplateOptions,
} from '../config.js';
import { ConfigParseError, CosmicConfigError } from '../error.js';

describe('config', function () {
  // describe('getCosmicExplorer', () => {
  //   it('should return an instance of Explorer', () => {
  //     const result = getCosmicExplorer();
  //     expect(result).toMatchObject({});
  //   });
  // });

  describe('readConfig', () => {
    it('should return valid config', async () =>
      pipe(
        Effect.gen(function* ($) {
          const result = yield* $(
            readConfig('src/common/test-fixtures/config/good-scribe.config.ts'),
          );
          expect(result).toMatchSnapshot();
        }),
        Effect.runPromise,
      ));
    describe('should return ConfigParseError ', () => {
      it('when reads config with invalid syntax', async () =>
        pipe(
          Effect.gen(function* ($) {
            const result = yield* $(
              readConfig(
                'src/common/test-fixtures/config/bad-syntax-scribe.config.ts',
              ),
              Effect.flip,
            );
            expect(result).toBeInstanceOf(ConfigParseError);
          }),
          Effect.runPromise,
        ));

      it('when reads config with missing export', async () =>
        pipe(
          Effect.gen(function* ($) {
            const result = yield* $(
              readConfig(
                'src/common/test-fixtures/config/missing-export-scribe.config.ts',
              ),
              Effect.flip,
            );
            expect(result).toBeInstanceOf(ConfigParseError);
          }),
          Effect.runPromise,
        ));
    });

    it('should return CosmicConfigError if getCosmicExplorer.load() throws', async () =>
      pipe(
        Effect.gen(function* ($) {
          const result = yield* $(readConfig('bad-path'), Effect.flip);
          expect(result).toBeInstanceOf(CosmicConfigError);
        }),
        Effect.runPromise,
      ));
  });

  describe('checkForTemplates', () => {
    it('should return input if non empty array', async () =>
      pipe(
        Effect.gen(function* ($) {
          const input = [''];
          const result = yield* $(checkForTemplates(input));
          expect(result).toBe(input);
        }),
        Effect.runPromise,
      ));

    it('should return CosmicConfigError if empty array', async () =>
      pipe(
        Effect.gen(function* ($) {
          const result = yield* $(checkForTemplates([]), Effect.flip);
          expect(result).toBeInstanceOf(CosmicConfigError);
        }),
        Effect.runPromise,
      ));
  });

  describe('readUserTemplateOptions', () => {
    it('should return the keys from config.template', async () =>
      pipe(
        Effect.gen(function* ($) {
          const result = yield* $(
            readUserTemplateOptions(
              'src/common/test-fixtures/config/good-scribe.config.ts',
            ),
          );
          expect(result).toEqual(
            expect.arrayContaining(['screen', 'component']),
          );
        }),
        Effect.runPromise,
      ));
  });

  describe('extractConfig', () => {
    it('should return config if isEmpty false', async () =>
      pipe(
        Effect.gen(function* ($) {
          const result = yield* $(
            extractConfig({
              isEmpty: false,
              config: 'abc',
              filepath: '',
            }),
          );
          expect(result).toEqual('abc');
        }),
        Effect.runPromise,
      ));

    it('should return CosmicConfigError if isEmpty true', async () =>
      pipe(
        Effect.gen(function* ($) {
          const result = yield* $(
            extractConfig({
              isEmpty: true,
              config: {},
              filepath: '',
            }),
            Effect.flip,
          );
          expect(result).toBeInstanceOf(CosmicConfigError);
        }),
        Effect.runPromise,
      ));

    it('should return CosmicConfigError if CosmicConfigResult was null', async () =>
      pipe(
        Effect.gen(function* ($) {
          const result = yield* $(extractConfig(null), Effect.flip);
          expect(result).toBeInstanceOf(CosmicConfigError);
        }),
        Effect.runPromise,
      ));
  });
});
