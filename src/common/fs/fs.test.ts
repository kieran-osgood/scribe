import { Context, Effect, pipe } from '@scribe/core';
import * as memfs from 'memfs';
import { vol } from 'memfs';
// import { cwdAsJson } from '../../../configs/vite/setup-fs';
import path from 'path';
// import { ReadFileError, WriteFileError } from './error';
import * as NFS from 'fs';
import * as FS from './node-fs';
import { ReadFileError, WriteFileError } from './error';
import { cwdAsJson } from '../../../configs/vite/setup-fs';

const fileContents = 'super secret file';

beforeEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vol.mkdirSync(process.cwd(), { recursive: true });
});
afterEach(() => vol.reset());

export const FSMock = Context.make(FS.FS, memfs.fs as unknown as typeof NFS);

describe('fs', () => {
  describe('readFile', () => {
    it('should read file to path', () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = './template1.ts';
          memfs.vol.writeFile(filePath, fileContents, err => {
            if (err) throw err;
          });

          const result = yield* $(FS.readFile(filePath, null));

          expect(String(result)).toBe(fileContents);
        }),
        Effect.provideContext(FSMock),
        Effect.runPromise
      ));

    it('throw error if file doesnt exist', () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = path.join(process.cwd(), './template2.ts');
          const result = yield* $(FS.readFile(filePath, null), Effect.flip);

          expect(result).toBeInstanceOf(ReadFileError);
        }),
        Effect.provideContext(FSMock),
        Effect.runPromise
      ));
  });

  describe('writeFile', () => {
    it('should write file to path and read it back', () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = './template3.ts';

          expect(
            yield* $(FS.writeFile(filePath, fileContents, null)) //
          ).toBe('./template3.ts');
          expect(
            yield* $(FS.readFile(filePath, { encoding: 'utf8' })) //
          ).toEqual(fileContents);
        }),
        Effect.provideContext(FSMock),
        Effect.runPromise
      ));

    it('should write file to path and read it back', () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = '/some/nonexistent/path/template4.ts';

          const result = yield* $(
            pipe(FS.writeFile(filePath, fileContents, null), Effect.flip)
          );
          expect(result).toBeInstanceOf(WriteFileError);
        }),
        Effect.provideContext(FSMock),
        Effect.runPromise
      ));
  });

  describe('mkdir', () => {
    it('creates recursively ', () =>
      pipe(
        Effect.gen(function* ($) {
          yield* $(FS.mkdir('./some/nested/pathway', { recursive: true }));
          expect(cwdAsJson()).toMatchSnapshot();

          const dirExists = NFS.existsSync('./some/nested/pathway');
          expect(dirExists).toEqual(true);

          yield* $(FS.mkdir('./tmpl/a/b', { recursive: true }));
          expect(cwdAsJson()).toMatchSnapshot();
        }),
        Effect.provideContext(FSMock),
        Effect.runPromise
      ));

    it('returns undefined if dir already exists', () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = './some/path';
          memfs.vol.mkdirSync(filePath, { recursive: true });
          expect(cwdAsJson()).toMatchSnapshot();

          const result = yield* $(FS.mkdir(filePath, { recursive: true }));
          expect(result).toBe(undefined);
          expect(cwdAsJson()).toMatchSnapshot();
        }),
        Effect.provideContext(FSMock),
        Effect.runPromise
      ));
  });
});

describe.only('writeFileWithDir', () => {
  it('should write file to path and read it back', () =>
    pipe(
      Effect.gen(function* ($) {
        const filePath = path.join(
          process.cwd(),
          './path/to/some/long/path/template5.ts'
        );

        const result = yield $(
          FS.writeFileWithDir(filePath, fileContents, null)
        );
        expect(result).toBe(filePath);
        const readResult = yield* $(FS.readFile(filePath, null));
        expect(String(readResult)).toEqual(fileContents);
      }),
      Effect.provideContext(FSMock),
      Effect.runPromise
    ));
});
