import { Effect, Layer, pipe } from 'effect';
import * as memfs from 'memfs';
import path from 'path';

import * as FS from '../fs.js';
import * as FSMock from '../fs-mock.js';

/** Provides a JSON representation of the current working directory
 * in the in-memory file system.
 *
 * @return {DirectoryJSON}
 */
export const cwdAsJson = (): memfs.DirectoryJSON =>
  memfs.vol.toJSON(process.cwd(), undefined, true);

const fileContents = 'super secret file';

beforeEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  memfs.vol.mkdirSync(process.cwd(), { recursive: true });
});
afterEach(() => {
  memfs.vol.reset();
});

describe('fs', () => {
  describe('writeFileWithDir', () => {
    it('should write file to path and read it back', async () =>
      pipe(
        Effect.gen(function* () {
          const filePath = './path/to/some/long/path/template5.txt';

          yield* FS.writeFileWithDir(filePath, fileContents);

          const fs = yield* FS.FS;
          const readResult = yield* fs.readFile(
            path.join('path/to/some/long/path/template5.txt'),
          );

          expect(String(readResult)).toEqual(fileContents);
        }),
        Effect.provide(FSMock.layer),
        Effect.runPromise,
      ));
  });
});
