import { DirectoryJSON, vol } from 'memfs';

/**
 * Provides a JSON representation of the current working directory
 * in the in-memory file system.
 *
 * @return {DirectoryJSON}
 */
export const cwdAsJson = (): DirectoryJSON =>
  vol.toJSON(process.cwd(), undefined, true);
