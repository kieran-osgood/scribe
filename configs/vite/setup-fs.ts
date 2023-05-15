/* eslint-disable jest/require-top-level-describe, node/no-sync, @typescript-eslint/no-explicit-any */

import { createFsFromVolume, DirectoryJSON, vol } from 'memfs';
import { ufs } from 'unionfs';

/**
 * Provides a JSON representation of the current working directory
 * in the in-memory file system.
 *
 * @return {DirectoryJSON}
 */
export const cwdAsJson = (): DirectoryJSON =>
  vol.toJSON(process.cwd(), undefined, true);

/**
 * "mock" the file system to use a union'd file system.
 *
 * Note that because of the union, any attempt to write to a folder that exists
 * on the native filesystem will bypass the in-memory fs unless the folder also
 * exists in that fs.
 */
vi.mock('fs', () => {
  beforeEach(() => {
    vol.mkdirSync(process.cwd(), { recursive: true });
  });
  afterEach(() => vol.reset());

  return (
    ufs
      // .use(jest.requireActual('fs'))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .use(createFsFromVolume(vol) as any) as unknown
  );
});
