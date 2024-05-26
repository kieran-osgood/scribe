import * as V from '@effect/vitest';
import { Effect } from 'effect';

import {
  checkForTemplatesKeys,
  mapCosmicConfig,
  readConfig,
  readUserTemplateOptions,
} from '../config.js';
import { ConfigParseError, CosmicConfigError } from '../error.js';

describe('readConfig', () => {
  V.it.scoped('should return valid config', () =>
    Effect.gen(function* ($) {
      const result = yield* $(
        readConfig('test/fixtures/config/good-scribe.config.ts'),
      );
      expect(result).toMatchSnapshot();
    }),
  );

  describe('should return ConfigParseError ', () => {
    V.it.scoped('when reads config with invalid syntax', () =>
      Effect.gen(function* ($) {
        const result = yield* $(
          readConfig('test/fixtures/config/bad-syntax-scribe.config.ts'),
          Effect.flip,
        );
        expect(result).toBeInstanceOf(ConfigParseError);
      }),
    );

    V.it.scoped('when reads config with missing export', () =>
      Effect.gen(function* ($) {
        const result = yield* $(
          readConfig('test/fixtures/config/missing-export-scribe.config.ts'),
          Effect.flip,
        );
        expect(result).toBeInstanceOf(ConfigParseError);
      }),
    );
  });

  V.it.scoped(
    'should return CosmicConfigError if getCosmicExplorer.load() throws',
    () =>
      Effect.gen(function* ($) {
        const result = yield* $(readConfig('bad-path'), Effect.flip);
        expect(result).toBeInstanceOf(CosmicConfigError);
      }),
  );
});

describe('checkForTemplates', () => {
  V.it.scoped('should return input if non empty array', () =>
    Effect.gen(function* ($) {
      const input = [''];
      const result = yield* $(checkForTemplatesKeys(input));
      expect(result).toBe(input);
    }),
  );

  V.it.scoped('should return CosmicConfigError if empty array', () =>
    Effect.gen(function* ($) {
      const result = yield* $(checkForTemplatesKeys([]), Effect.flip);
      expect(result).toBeInstanceOf(CosmicConfigError);
    }),
  );
});

describe('readUserTemplateOptions', () => {
  V.it.scoped('should return the keys from config.template', () =>
    Effect.gen(function* ($) {
      const result = yield* $(
        readUserTemplateOptions('test/fixtures/config/good-scribe.config.ts'),
      );
      expect(result).toEqual(expect.arrayContaining(['screen', 'component']));
    }),
  );
});

describe('extractConfig', () => {
  V.it.scoped('should return config if isEmpty false', () =>
    Effect.gen(function* ($) {
      const result = yield* $(
        mapCosmicConfig({
          isEmpty: false,
          config: 'abc',
          filepath: '',
        }),
      );
      expect(result).toEqual('abc');
    }),
  );

  V.it.scoped('should return CosmicConfigError if isEmpty true', () =>
    Effect.gen(function* ($) {
      const result = yield* $(
        mapCosmicConfig({
          isEmpty: true,
          config: {},
          filepath: '',
        }),
        Effect.flip,
      );
      expect(result).toBeInstanceOf(CosmicConfigError);
    }),
  );

  V.it.scoped(
    'should return CosmicConfigError if CosmicConfigResult was null',
    () =>
      Effect.gen(function* ($) {
        const result = yield* $(mapCosmicConfig(null), Effect.flip);
        expect(result).toBeInstanceOf(CosmicConfigError);
      }),
  );
});
