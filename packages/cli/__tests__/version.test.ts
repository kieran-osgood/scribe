import * as V from '@effect/vitest';
import { Array, Effect, Fiber } from 'effect';

import packageJson from '../../../package.json';
import * as MockConsole from '../../../test/mock-console.js';
import { runEffect } from '../../../test/utils.js';
import * as Cli from '../cli.js';

describe('VersionCommand', () => {
  V.it.scoped(
    '[Given] --version flag [Then] print version from package.json',
    () => {
      return Effect.gen(function* ($) {
        const args = Array.make('', '', '--version');
        const fiber = yield* $(Effect.fork(Cli.run(args)));

        yield* $(Fiber.join(fiber));

        const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));

        expect(lines).toHaveLength(1);
        expect(lines[0]).toContain(packageJson.version);
      }).pipe(runEffect(''));
    },
  );
});
