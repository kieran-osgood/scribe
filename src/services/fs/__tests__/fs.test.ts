import { Context, Effect, pipe } from 'effect';
import * as NFS from 'fs';
import * as memfs from 'memfs';
import { DirectoryJSON, vol } from 'memfs';
import path from 'path';

import { MkDirError, ReadFileError, StatError, WriteFileError } from '../error';
import * as FS from '../fs';

/**
 * Provides a JSON representation of the current working directory
 * in the in-memory file system.
 *
 * @return {DirectoryJSON}
 */
export const cwdAsJson = (): DirectoryJSON =>
  vol.toJSON(process.cwd(), undefined, true);

const fileContents = 'super secret file';

beforeEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vol.mkdirSync(process.cwd(), { recursive: true });
});
afterEach(() => { vol.reset(); });

export const FSMock = Context.make(FS.FS, memfs.fs as unknown as typeof NFS);

describe('fs', () => {
  describe('readFile', () => {
    it('should read file to path', async () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = 'template1.txt';
          memfs.vol.writeFileSync(filePath, fileContents);

          const result = yield* $(FS.readFile(filePath, null));

          expect(String(result)).toBe(fileContents);
        }),
        Effect.provide(FSMock),
        Effect.runPromise,
      ));

    it('throw error if file doesnt exist', async () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = path.join(process.cwd(), './template2.txt');
          const result = yield* $(FS.readFile(filePath, null), Effect.flip);

          expect(result).toBeInstanceOf(ReadFileError);
        }),
        Effect.provide(FSMock),
        Effect.runPromise,
      ));
  });

  describe('writeFile', () => {
    it('should write file to path and read it back', async () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = './template3.txt';

          expect(
            yield* $(FS.writeFile(filePath, fileContents, null)), //
          ).toBe('./template3.txt');
          expect(
            yield* $(FS.readFile(filePath, { encoding: 'utf8' })), //
          ).toEqual(fileContents);
        }),
        Effect.provide(FSMock),
        Effect.runPromise,
      ));

    it('should write file to path and read it back', async () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = '/some/nonexistent/path/template4.txt';

          const result = yield* $(
            pipe(FS.writeFile(filePath, fileContents, null), Effect.flip),
          );
          expect(result).toBeInstanceOf(WriteFileError);
        }),
        Effect.provide(FSMock),
        Effect.runPromise,
      ));
  });

  describe('mkdir', () => {
    it('creates recursively ', async () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = './mkdir/nested/path';
          const statError = yield* $(
            FS.isFileOrDirectory(filePath),
            Effect.flip,
          );
          expect(statError).toBeInstanceOf(StatError);

          yield* $(FS.mkdir(filePath, { recursive: true }));

          const exists = yield* $(FS.isFileOrDirectory(filePath));
          expect(exists).toBe(true);
        }),
        Effect.provide(FSMock),
        Effect.runPromise,
      ));

    it('returns undefined if dir already exists', async () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = './some/path';
          memfs.vol.mkdirSync(filePath, { recursive: true });
          const previousDirStructure = cwdAsJson();

          const result = yield* $(FS.mkdir(filePath, { recursive: true }));
          expect(result).toBe(undefined);
          expect(cwdAsJson()).toEqual(previousDirStructure);
        }),
        Effect.provide(FSMock),
        Effect.runPromise,
      ));

    it('fails with error if mkdir cb has error', async () =>
      pipe(
        Effect.gen(function* ($) {
          const filePath = './some/path';
          const result = yield* $(FS.mkdir(filePath), Effect.flip);
          expect(result).toBeInstanceOf(MkDirError);
        }),
        Effect.provide(FSMock),
        Effect.runPromise,
      ));
  });
});

describe('writeFileWithDir', () => {
  it('should write file to path and read it back', async () =>
    pipe(
      Effect.gen(function* ($) {
        const filePath = './path/to/some/long/path/template5.txt';

        const result = yield* $(
          FS.writeFileWithDir(filePath, fileContents, null),
        );
        expect(result).toBe(filePath);

        const readResult = yield* $(
          FS.readFile(path.join('path/to/some/long/path/template5.txt'), null),
        );
        expect(String(readResult)).toEqual(fileContents);
      }),
      Effect.provide(FSMock),
      Effect.runPromise,
    ));
});
