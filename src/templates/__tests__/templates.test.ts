import { Effect, pipe, RA } from '@scribe/core';
import {
  constructTemplate,
  ConstructTemplateCtx,
  Ctx,
  writeTemplate,
  WriteTemplateCtx,
} from '../index';
import * as FS from '@scribe/fs';
import * as memfs from 'memfs';
import { vol } from 'memfs';
import path from 'path';
import * as Process from '../../process';

beforeEach(() => {
  vi.restoreAllMocks();
});

const screenFileContents = `describe('{{Name}}', function() {
  it('should ', function() {

  });
});`;

beforeEach(() => {
  vol.mkdirSync(process.cwd(), { recursive: true });
  vol.mkdirSync(path.join(process.cwd(), './test-fixtures'), {
    recursive: true,
  });
});
afterEach(() => vol.reset());

const mockConfig = {
  options: {
    templatesDirectories: ['test-fixtures'],
    rootOutDir: '',
  },
  templates: {
    screen: {
      outputs: [
        {
          templateFileKey: 'screen',
          output: {
            directory: 'test-fixtures/config',
            fileName: '{{Name}}.ts',
          },
        },
        {
          templateFileKey: 'screen.test',
          output: {
            directory: 'test-fixtures/config',
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
  input: {
    template: 'screen',
    name: 'login',
  },
  templateKeys: ['screen'],
} satisfies Ctx;

const templateOutput = {
  templateFileKey: 'screen',
  output: {
    fileName: '{{Name}}.ts', // good-scribe
    directory: 'test-fixtures/config',
  },
};

describe('writeTemplate', () => {
  it('should write file', () =>
    pipe(
      Effect.gen(function* ($) {
        const ctx = {
          fileContents,
          templateOutput,
          ..._ctx,
        } satisfies WriteTemplateCtx;
        const res = writeTemplate(ctx);
        const result = yield* $(res);
        expect(result).toBe(
          path.join(process.cwd(), '/test-fixtures/config/login.ts'),
        );

        const readResult = yield* $(
          FS.readFile('test-fixtures/config/login.ts', null),
        );
        expect(String(readResult)).toBe(fileContents);
      }),
      FS.FSMock,
      Process.ProcessLive,
      Effect.runPromise,
    ));
});

describe('constructTemplate', () => {
  it('should return fileContents formatted with variables', () =>
    pipe(
      Effect.gen(function* ($) {
        const ctx = {
          templateOutput: {
            templateFileKey: 'screen',
            output: {
              fileName: '{{Name}}.ts', // good-scribe
              directory: '',
            },
          },
          ..._ctx,
        } satisfies ConstructTemplateCtx;

        yield* $(
          FS.writeFileWithDir(
            path.join(process.cwd(), './test-fixtures/screen.scribe'),
            screenFileContents,
            null,
          ),
        );

        const result = yield* $(
          constructTemplate(ctx),
          Effect.map(RA.map(_ => _.fileContents)),
        );

        expect(result).toMatchInlineSnapshot(`
          [
            "describe('login', function() {
            it('should ', function() {

            });
          });",
          ]
        `);
      }),
      FS.FSMock,
      Process.ProcessLive,
      Effect.runPromise,
    ));

  it('should check process root dir for templates', () =>
    pipe(
      Effect.gen(function* ($) {
        const ctx = {
          ..._ctx,
          templateOutput: {
            templateFileKey: 'screen',
            output: {
              fileName: '{{Name}}.ts',
              directory: '',
            },
          },
          config: {
            templates: _ctx.config.templates,
          },
        } satisfies ConstructTemplateCtx;

        const rootDirScribePath = path.join(process.cwd(), '', 'screen.scribe');
        memfs.vol.writeFileSync(rootDirScribePath, screenFileContents);

        const result = yield* $(
          constructTemplate(ctx),
          Effect.map(RA.map(_ => _.fileContents)),
        );

        expect(result).toMatchInlineSnapshot(`
          [
            "describe('login', function() {
            it('should ', function() {

            });
          });",
          ]
        `);
      }),
      FS.FSMock,
      Process.ProcessLive,
      Effect.runPromise,
    ));

  it("should throw if scribe file isn't readable", () =>
    pipe(
      Effect.gen(function* ($) {
        const ctx = {
          templateOutput: {
            templateFileKey: 'BADKEY',
            output: {
              fileName: '', // good-scribe
              directory: '',
            },
          },
          ..._ctx,
        } satisfies ConstructTemplateCtx;

        const result = yield* $(constructTemplate(ctx), Effect.flip);

        expect(result).toBeInstanceOf(FS.ReadFileError);
      }),
      FS.FSMock,
      Process.ProcessMock,
      Effect.runPromise,
    ));
});
