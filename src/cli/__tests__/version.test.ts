import * as Cli from '@scribe/cli';
import { Effect, Fiber, ReadonlyArray } from 'effect';
import { describe } from 'vitest';

import packageJson from '../../../package.json';
import { runEffect } from './fixtures.js';
import * as MockConsole from './mock-console.js';

describe('VersionCommand', () => {
  it('[Given] --version flag [Then] print version from package.json', async () => {
    return Effect.gen(function* ($) {
      const args = ReadonlyArray.make('--version');
      const fiber = yield* $(Effect.fork(Cli.run(args)));

      yield* $(Fiber.join(fiber));

      const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
      expect(lines).toMatchInlineSnapshot(`
        [
          "${packageJson.version}
        ",
        ]
      `);
    }).pipe(runEffect(''));
  });
});
