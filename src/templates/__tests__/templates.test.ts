import { Chunk, Context, Effect, pipe } from '@scribe/core';
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
import NFS from 'fs';
import path from 'path';
import { TemplateFileError } from '../error';

beforeEach(() => {
  vi.restoreAllMocks();
});

const screenFileContents = `describe('{{Name}}', function() {
  it('should ', function() {

  });
});`;

beforeEach(() => {
  vol.mkdirSync(process.cwd(), { recursive: true });
  vol.mkdirSync(path.join(process.cwd(), './test'), { recursive: true });
});
afterEach(() => vol.reset());

export const FSMock = Context.make(FS.FS, memfs.fs as unknown as typeof NFS);

const mockConfig = {
  options: {
    templatesDirectories: ['test'],
    rootOutDir: '',
  },
  templates: {
    screen: {
      outputs: [
        {
          templateFileKey: 'screen',
          output: {
            directory: 'test/config',
            fileName: '{{Name}}.ts',
          },
        },
        {
          templateFileKey: 'screen.test',
          output: {
            directory: 'test/config',
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
    directory: 'test/config',
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
        expect(result).toBe(path.join(process.cwd(), '/test/config/login.ts'));

        const readResult = yield* $(FS.readFile('test/config/login.ts', null));
        expect(String(readResult)).toBe(fileContents);
      }),
      Effect.provideContext(FSMock),
      Effect.runPromise
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
            path.join(process.cwd(), './test/screen.scribe'),
            screenFileContents,
            null
          )
        );

        const result = yield* $(
          constructTemplate(ctx), //
          Effect.collectAll,
          Effect.map(Chunk.map(_ => _.fileContents))
        );

        expect(result).toMatchSnapshot();
      }),
      Effect.provideContext(FSMock),
      Effect.runPromise
    ));

  it("should throw if scribe file isn't readable", () =>
    pipe(
      Effect.gen(function* ($) {
        const ctx = {
          templateOutput: {
            templateFileKey: 'screenz',
            output: {
              fileName: '{{Name}}.ts', // good-scribe
              directory: '',
            },
          },
          ..._ctx,
        } satisfies ConstructTemplateCtx;
        const result = yield* $(
          constructTemplate(ctx),
          Effect.collectAll,
          Effect.flip
        );

        expect(result).toBeInstanceOf(TemplateFileError);
      }),
      Effect.provideContext(FSMock),
      Effect.runPromise
    ));
});
