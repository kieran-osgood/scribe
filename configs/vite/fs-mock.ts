import { Context } from '@scribe/core';
import * as memfs from 'memfs';
import { vol } from 'memfs';
import NFS from 'fs';
import * as FS from '@scribe/fs';

beforeEach(() => {
  vi.restoreAllMocks();
});

beforeEach(() => {
  vol.mkdirSync(process.cwd(), { recursive: true });
});
afterEach(() => vol.reset());

export const FSMock = Context.make(FS.FS, memfs.fs as unknown as typeof NFS);
