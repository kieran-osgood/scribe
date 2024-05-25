import { FileSystem } from '@effect/platform';
import { SystemError } from '@effect/platform/Error';
import { NodeFileSystem } from '@effect/platform-node';
import * as V from '@effect/vitest';
import * as FS from '@scribe/fs';
import * as Process from '@scribe/process';
import { Array, Effect, Layer } from 'effect';
import path from 'path';
import * as tempy from 'tempy';

import {
  constructTemplate,
  ConstructTemplateCtx,
  Ctx,
  writeTemplate,
  WriteTemplateCtx,
} from '../template-file.js';

beforeEach(() => {
  V.vitest.restoreAllMocks();
});

const screenFileContents = `describe('{{Name}}', function() {
  it('should ', function() {

  });
});`;

const mockConfig = {
  options: {
    templatesDirectories: ['test/fixtures'],
    rootOutDir: '',
  },
  templates: {
    screen: {
      outputs: [
        {
          templateFileKey: 'screen',
          output: {
            directory: 'test/fixtures',
            fileName: '{{Name}}.ts',
          },
        },
        {
          templateFileKey: 'screen.test',
          output: {
            directory: 'test/fixtures',
            fileName: '{{Name}}.test.ts',
          },
        },
      ],
    },
  },
};

const fileContents = 'TEST';

const _ctx = {
  config: mockConfig,
  template: 'screen',
  name: 'login',
  templates: ['screen'],
} satisfies Ctx;

const templateOutput = {
  templateFileKey: 'screen',
  output: {
    fileName: '{{Name}}.ts', // good-scribe
    directory: 'test/fixtures/config',
  },
};

describe('writeTemplate', () => {
  V.it.scoped('should write file', () => {
    const tmpPath = tempy.temporaryDirectory();

    return Effect.gen(function* ($) {
      const ctx = {
        fileContents,
        output: templateOutput,
        ..._ctx,
      } satisfies WriteTemplateCtx;
      const result = yield* $(writeTemplate(ctx));
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
      Effect.provideService(Process.Process, Process.makeProcessMock(tmpPath)),
    );
  });
});

describe('constructTemplate', () => {
  V.it.scoped('should return fileContents formatted with variables', () => {
    const tmpPath = tempy.temporaryDirectory();

    return Effect.gen(function* ($) {
      const ctx = {
        output: {
          templateFileKey: 'screen',
          output: {
            fileName: '{{Name}}.ts', // good-scribe
            directory: '',
          },
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
      Effect.provideService(Process.Process, Process.makeProcessMock(tmpPath)),
    );
  });

  V.it.scoped('should check process root dir for templates', () =>
    Effect.gen(function* ($) {
      const ctx = {
        ..._ctx,

        output: {
          templateFileKey: 'screen',
          output: {
            fileName: '{{Name}}.ts',
            directory: '',
          },
        },
        config: {
          templates: _ctx.config.templates,
          options: {
            templatesDirectories: ['test/fixtures/templates'],
            rootOutDir: '',
          },
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
        output: {
          templateFileKey: 'BADKEY',
          output: {
            fileName: '', // good-scribe
            directory: '',
          },
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
