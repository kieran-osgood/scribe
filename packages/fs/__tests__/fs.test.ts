import { FileSystem } from '@effect/platform';
import { NodeFileSystem } from '@effect/platform-node';
import * as V from '@effect/vitest';
import { Effect, Layer } from 'effect';
import path from 'path';
import * as tempy from 'tempy';

import * as FS from '../fs.js';

const fileContents = 'super secret file';

describe('writeFileWithDir', () => {
  V.it.scoped('should write file to path and read it back', () => {
    const tmpPath = tempy.temporaryDirectory();
    return Effect.gen(function* ($) {
      const filePath = path.join(
        tmpPath,
        './path/to/some/long/path/template5.txt',
      );

      const result = yield* $(FS.writeFileWithDir(filePath, fileContents));
      expect(result).toBe(filePath);
      const fs = yield* $(FileSystem.FileSystem);

      const readResult = yield* $(
        fs.readFile(path.join(tmpPath, 'path/to/some/long/path/template5.txt')),
      );
      expect(String(readResult)).toEqual(fileContents);
    }).pipe(Effect.provide(Layer.mergeAll(NodeFileSystem.layer)));
  });
});
