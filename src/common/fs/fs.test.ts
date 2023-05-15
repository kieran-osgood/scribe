import { Effect, pipe } from '@scribe/core';
import { fs, vol } from 'memfs';
import { cwdAsJson } from '../../../configs/vite/setup-fs';
import * as FS from './node-fs';
import path from 'path';
import { ErrnoError } from './error';

const fileContents = 'super secret file';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fs', () => {
  describe('readFile', () => {
    it('should read file to path', () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = path.join(process.cwd(), './template.ts');
          vol.writeFile(filePath, fileContents, err => {
            if (err) throw err;
          });

          const result = yield* $(FS.readFile(filePath, null));

          expect(String(result)).toBe(fileContents);
        }),
        Effect.runPromise
      ));

    it('throw error if file doesnt exist', () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = path.join(process.cwd(), './template.ts');
          const result = yield* $(FS.readFile(filePath, null), Effect.flip);

          expect(result._tag).toBe('ErrnoError');
          expect(result).toBeInstanceOf(ErrnoError);
        }),
        Effect.runPromise
      ));
  });

  describe('writeFile', () => {
    it('should write file to path and read it back', () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = path.join(process.cwd(), './template.ts');

          expect(
            yield* $(FS.writeFile(filePath, fileContents, null)) //
          ).toBe(true);
          expect(
            yield* $(FS.readFile(filePath, { encoding: 'utf8' })) //
          ).toEqual(fileContents);
        }),
        Effect.runPromise
      ));

    // NOT IMPLEMENTED
    it.todo('throw error if file is not writable');
    // it.skip('throw error if file is not writable', () =>
    //   pipe(
    //     Effect.gen(function* ($) {
    //       const filePath = path.join(process.cwd(), './template.ts');
    //
    //       expect(
    //         yield* $(FS.writeFile(filePath, fileContents, null)) //
    //       ).toBe(true);
    //       expect(
    //         yield* $(FS.readFile(filePath, { encoding: 'utf8' })) //
    //       ).toEqual(fileContents);
    //     }),
    //     Effect.runPromise
    //   ));
  });

  describe('mkdir', () => {
    it('creates recursively ', () =>
      pipe(
        Effect.gen(function* ($) {
          yield* $(FS.mkdir('./some/nested/pathway', { recursive: true }));
          expect(cwdAsJson()).toMatchSnapshot();

          const dirExists = fs.existsSync('./some/nested/pathway');
          expect(dirExists).toEqual(true);

          yield* $(FS.mkdir('./tmpl/a/b', { recursive: true }));
          expect(cwdAsJson()).toMatchSnapshot();
        }),
        Effect.runPromise
      ));

    it('returns undefined if dir already exists', () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = './some/path';
          vol.mkdirSync(filePath, { recursive: true });
          expect(cwdAsJson()).toMatchSnapshot();

          const result = yield* $(FS.mkdir(filePath, { recursive: true }));
          expect(result).toBe(undefined);
          expect(cwdAsJson()).toMatchSnapshot();
        }),
        Effect.runPromise
      ));
  });

  describe('writeFileWithDir', () => {
    it('should write file to path and read it back', () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = '/path/to/template.ts';

          const result = yield $(
            FS.writeFileWithDir(filePath, fileContents, null)
          );
          expect(result).toBe(true);

          const readResult = yield* $(
            FS.readFile(filePath, { encoding: 'utf8' })
          );
          expect(readResult).toEqual(fileContents);
        }),
        Effect.runPromise
      ));
  });
});