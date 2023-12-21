import spawnAsync from '@expo/spawn-async';
import stripAnsi from 'strip-ansi';
import { describe } from 'vitest';

import packageJson from '../../../package.json';
import { cliPath } from './fixtures';

describe('VersionCommand', () => {
  it('[Given] --version flag [Then] print version from package.json', async () => {
    const t = await spawnAsync(cliPath, [`--version`]);
    expect(t.status).toBe(0);
    expect(stripAnsi(t.stdout)).toMatchInlineSnapshot(`
        "${packageJson.version}
        
        "
      `);
  });
});
