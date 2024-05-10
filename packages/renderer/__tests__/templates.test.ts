import { Array, Effect, pipe } from 'effect';
import * as memfs from 'memfs';
import { vol } from 'memfs';
import path from 'path';

import * as FS from '../../fs/index.js';
import * as Process from '../../process/index.js';
import {
  constructTemplate,
  ConstructTemplateCtx,
  Ctx,
  writeTemplate,
  WriteTemplateCtx,
} from '../template-file.js';

beforeEach(() => {
  vi.restoreAllMocks();
});

const screenFileContents = `describe('{{Name}}', function() {
  it('should ', function() {

  });
});`;

beforeEach(() => {
  vol.mkdirSync(process.cwd(), { recursive: true });
  vol.mkdirSync(path.join(process.cwd(), './test/fixtures'), {
    recursive: true,
  });
});
afterEach(() => {
  vol.reset();
});

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
  it('should write file', async () =>
    pipe(
      Effect.gen(function* ($) {
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

        const readResult = yield* $(
          FS.readFile('test/fixtures/config/login.ts', null),
        );
        expect(String(readResult)).toBe(fileContents);
      }),
      Effect.provideService(FS.FS, FS.FSMock),
      // TODO: ProcessLive in use?
      Effect.provideService(Process.Process, Process.ProcessLive),
      Effect.runPromise,
    ));
});

describe('constructTemplate', () => {
  it('should return fileContents formatted with variables', async () =>
    pipe(
      Effect.gen(function* ($) {
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

        yield* $(
          FS.writeFileWithDir(
            path.join(process.cwd(), './test/fixtures/screen.scribe'),
            screenFileContents,
            null,
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
      }),
      Effect.provideService(FS.FS, FS.FSMock),
      Effect.provideService(Process.Process, Process.ProcessLive),
      Effect.runPromise,
    ));

  it('should check process root dir for templates', async () =>
    pipe(
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
          },
        } satisfies ConstructTemplateCtx;

        const rootDirScribePath = path.join(process.cwd(), '', 'screen.scribe');
        memfs.vol.writeFileSync(rootDirScribePath, screenFileContents);

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
      }),
      Effect.provideService(FS.FS, FS.FSMock),
      Effect.provideService(Process.Process, Process.ProcessLive),
      Effect.runPromise,
    ));

  it("should throw if scribe file isn't readable", async () =>
    pipe(
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

        expect(result).toBeInstanceOf(FS.ReadFileError);
      }),
      Effect.provideService(FS.FS, FS.FSMock),
      Effect.provideService(Process.Process, Process.ProcessLive),
      Effect.runPromise,
    ));
});
