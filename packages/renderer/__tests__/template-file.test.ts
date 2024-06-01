import { FileSystem } from '@effect/platform';
import { SystemError } from '@effect/platform/Error';
import { NodeFileSystem } from '@effect/platform-node';
import * as V from '@effect/vitest';
import { GeneratorConfig, ScribeConfig } from '@scribe/config';
import * as FS from '@scribe/fs';
import * as Process from '@scribe/process';
import { Array, Effect, Layer } from 'effect';
import path from 'path';
import * as tempy from 'tempy';
import { createMinimalProject } from 'test/utils.js';

import { GetTemplateError } from '../error.js';
import {
  constructTemplate,
  ConstructTemplateCtx,
  Ctx,
  getFilePaths,
  render,
  writeFile,
  writeFiles,
  WriteTemplateCtx,
} from '../template-file.js';

beforeEach(() => {
  V.vitest.restoreAllMocks();
});

const mockConfig = {
  templatesDirectories: ['test/fixtures'],
  generators: {
    screen: [
      {
        key: 'screen',
        directory: 'test/fixtures',
        fileName: '{{Key}}.ts',
      },
      {
        key: 'screen.test',
        directory: 'test/fixtures',
        fileName: '{{Key}}.test.ts',
      },
    ],
  },
} satisfies ScribeConfig;

const _ctx = {
  config: mockConfig,
  template: 'screen',
  key: 'login',
  generators: ['screen'],
} satisfies Ctx;

const generator = {
  key: 'screen',
  fileName: '{{Key}}.ts', // good-scribe
  directory: 'test/fixtures/config',
} satisfies GeneratorConfig;

describe('render', () => {
  V.it.scoped('should interpolate the variables passed to it', () =>
    Effect.gen(function* ($) {
      const result = yield* $(render('Hello {{Key}}', { Key: 'world' }));
      expect(result).toBe('Hello world');
    }),
  );

  V.it.scoped('should return an error channel for missing key', () =>
    Effect.gen(function* ($) {
      const result = yield* $(render('', {}));
      expect(result).toBe('');
    }),
  );
});

describe('getFilePaths', () => {
  V.it.scoped('should default to empty array for no directories', () => {
    const tmpPath = tempy.temporaryDirectory();

    return Effect.gen(function* ($) {
      const paths = yield* $(
        getFilePaths({
          ..._ctx,
          config: { ..._ctx.config, templatesDirectories: [] },
          generator,
        }),
      );
      expect(paths).toEqual([]);
    }).pipe(
      Effect.provideService(Process.Process, Process.getProcessMock(tmpPath)),
    );
  });

  V.it.scoped(
    'should map the directories with the key to a scribe file',
    () => {
      const tmpPath = tempy.temporaryDirectory();

      return Effect.gen(function* ($) {
        const paths = yield* $(getFilePaths({ ..._ctx, generator }));
        expect(paths).toEqual([
          `${tmpPath}/${_ctx.config.templatesDirectories[0]}/${generator.key}.scribe`,
        ]);
      }).pipe(
        Effect.provideService(Process.Process, Process.getProcessMock(tmpPath)),
      );
    },
  );
});

describe('writeFile', () => {
  V.it.scoped('should write file', () => {
    const tmpPath = tempy.temporaryDirectory();
    const fileContents = 'TEST';

    return Effect.gen(function* ($) {
      const ctx = {
        fileContents,
        generator: generator,
        ..._ctx,
      } satisfies WriteTemplateCtx;
      const result = yield* $(writeFile(ctx));
      const _process = yield* $(Process.Process);
      expect(result).toBe(
        path.join(_process.cwd(), '/test/fixtures/config/login.ts'),
      );
      const fs = yield* $(FileSystem.FileSystem);
      const readResult = yield* $(
        fs.readFile(path.join(tmpPath, 'test/fixtures/config/login.ts')),
      );
      expect(String(readResult)).toBe(fileContents);
    }).pipe(
      Effect.provide(Layer.mergeAll(NodeFileSystem.layer)),
      Effect.provideService(Process.Process, Process.getProcessMock(tmpPath)),
    );
  });
});

describe('writeFiles', () => {
  V.it.scoped('should write files', () => {
    const cwd = createMinimalProject({
      fixtures: { templateFiles: true, configFile: true },
    });
    return Effect.gen(function* ($) {
      const ctx = {
        ..._ctx,
        generators: ['screen', 'screen.test'],
      } satisfies Ctx;

      const result = yield* $(writeFiles(ctx));
      expect(result).toStrictEqual([
        path.join(cwd, '/test/fixtures/login.ts'),
        path.join(cwd, '/test/fixtures/login.test.ts'),
      ]);

      const fs = yield* $(FileSystem.FileSystem);
      const readResult = yield* $(
        fs.readFile(path.join(cwd, 'test/fixtures/login.ts')),
      );

      expect(String(readResult)).toMatchInlineSnapshot(`
        "// @ts-ignore
        import * as React from 'react';

        type loginProps = {}
        function loginScreen() {

        }
        "
      `);
      const readResultTest = yield* $(
        fs.readFile(path.join(cwd, 'test/fixtures/login.test.ts')),
      );
      expect(String(readResultTest)).toMatchInlineSnapshot(`
        "describe('login', function() {
          it('should ', function() {

          });
        });
        "
      `);
    }).pipe(
      Effect.provide(Layer.mergeAll(NodeFileSystem.layer)),
      Effect.provideService(Process.Process, Process.getProcessMock(cwd)),
    );
  });

  V.it.scoped(
    '[Given] template key A [When] template Key A doesnt exist [Then] returns GetTemplateError',
    () => {
      const cwd = createMinimalProject({
        fixtures: { templateFiles: true, configFile: true },
      });
      return Effect.gen(function* ($) {
        const ctx = {
          ..._ctx,
          generators: ['screen', 'screen.test'],
          template: 'blah',
        } satisfies Ctx;

        const error = yield* $(writeFiles(ctx), Effect.flip);
        expect(error).toBeInstanceOf(GetTemplateError);
      }).pipe(
        Effect.provide(Layer.mergeAll(NodeFileSystem.layer)),
        Effect.provideService(Process.Process, Process.getProcessMock(cwd)),
      );
    },
  );
});

describe('constructTemplate', () => {
  const screenFileContents = `describe('{{Key}}', function() {
  it('should ', function() {

  });
});`;
  V.it.scoped('should return fileContents formatted with variables', () => {
    const tmpPath = tempy.temporaryDirectory();

    return Effect.gen(function* ($) {
      const ctx = {
        generator: {
          key: 'screen',
          fileName: '{{Key}}.ts', // good-scribe
          directory: '',
        },
        ..._ctx,
      } satisfies ConstructTemplateCtx;

      const _process = yield* $(Process.Process);
      yield* $(
        FS.writeFileWithDir(
          path.join(_process.cwd(), './test/fixtures/screen.scribe'),
          screenFileContents,
        ),
      );
      const result = yield* $(
        constructTemplate(ctx),
        Effect.map(Array.map(_ => _.fileContents)),
      );

      expect(result).toMatchInlineSnapshot(`
          [
            "describe('login', function() {
            it('should ', function() {

            });
          });",
          ]
        `);
    }).pipe(
      Effect.provide(Layer.mergeAll(NodeFileSystem.layer)),
      Effect.provideService(Process.Process, Process.getProcessMock(tmpPath)),
    );
  });

  V.it.scoped('should check process root dir for templates', () =>
    Effect.gen(function* ($) {
      const ctx = {
        ..._ctx,

        generator: {
          key: 'screen',
          fileName: '{{Key}}.ts',
          directory: '',
        },
        config: {
          generators: _ctx.config.generators,
          templatesDirectories: ['test/fixtures/templates'],
        },
      } satisfies ConstructTemplateCtx;

      const result = yield* $(
        constructTemplate(ctx),
        Effect.map(Array.map(_ => _.fileContents)),
      );

      expect(result[0]).toMatchInlineSnapshot(`
        "// @ts-ignore
        import * as React from 'react';

        type loginProps = {}
        function loginScreen() {

        }
        "
      `);
    }).pipe(
      Effect.provide(Layer.mergeAll(NodeFileSystem.layer)),
      Effect.provideService(Process.Process, Process.ProcessLive),
    ),
  );

  V.it.scoped("should throw if scribe file isn't readable", () =>
    Effect.gen(function* ($) {
      const ctx = {
        generator: {
          key: 'BADKEY',
          fileName: '', // good-scribe
          directory: '',
        },
        ..._ctx,
      } satisfies ConstructTemplateCtx;

      const result = yield* $(constructTemplate(ctx), Effect.flip);

      expect(result._tag).toBe('SystemError');

      const error = result as SystemError;
      expect(error.reason).toBe('NotFound');
      expect(error.method).toBe('readFile');
      expect(error.pathOrDescriptor).toContain('BADKEY.scribe');
    }).pipe(
      Effect.provide(Layer.mergeAll(NodeFileSystem.layer)),
      Effect.provideService(Process.Process, Process.ProcessLive),
    ),
  );
});
