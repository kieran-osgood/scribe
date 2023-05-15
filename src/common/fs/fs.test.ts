import { Effect, pipe } from '@scribe/core';
import { fs, vol } from 'memfs';
import { cwdAsJson } from '../../../setup-fs';
import * as FS from './node-fs';

const fileContents = 'super secret file';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('fs', () => {
  describe('readFile', function () {
    it('should read file to path', async () => {
      vol.writeFile('template.ts', fileContents, () => {});

      const result = await pipe(
        FS.readFile('./template.ts', null),
        Effect.runPromise
      );
      expect(String(result)).toBe(fileContents);
    });

    it('throw error if file doesnt exist', async () => {
      const read = FS.readFile('./template.ts', null);
      await expect(() =>
        Effect.runPromise(read)
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        '"{\\"_tag\\":\\"ErrnoError\\",\\"error\\":{\\"code\\":\\"ENOENT\\",\\"path\\":\\"./template.ts\\",\\"prev\\":null}}"'
      );
    });
  });

  describe('writeFile', function () {
    it('should write file to path and read it back', async () => {
      const result = await pipe(
        FS.writeFile('./template.ts', fileContents, null),
        Effect.runPromise
      );
      expect(result).toBe(true);

      const readResult = await pipe(
        FS.readFile('./template.ts', { encoding: 'utf8' }),
        Effect.runPromise
      );
      expect(readResult).toEqual(fileContents);
    });

    it.todo('throw error if file is not writable');
  });

  describe('mkdir', function () {
    it('creates recursively ', async () => {
      await pipe(
        FS.mkdir('./some/nested/pathway', { recursive: true }),
        Effect.runPromise
      );

      expect(cwdAsJson()).toMatchInlineSnapshot(`
        {
          "some/nested/pathway": null,
        }
      `);
      const dirExists = fs.existsSync('./some/nested/pathway');
      expect(dirExists).toEqual(true);

      await pipe(
        FS.mkdir('./tmpl/a/b', { recursive: true }),
        Effect.runPromise
      );
      expect(cwdAsJson()).toMatchInlineSnapshot(`
        {
          "some/nested/pathway": null,
          "tmpl/a/b": null,
        }
      `);
    });

    it.todo('doesnt throw if dir already exists');
  });

  describe('writeFileWithDir', function () {
    it('should write file to path and read it back', async () => {
      const result = await pipe(
        FS.writeFileWithDir('/path/to/template.ts', fileContents, null),
        Effect.runPromise
      );
      expect(result).toBe(true);

      const readResult = await pipe(
        FS.readFile('/path/to/template.ts', { encoding: 'utf8' }),
        Effect.runPromise
      );
      expect(readResult).toEqual(fileContents);
    });
  });
});
