import {
  Console as EffectConsole,
  Effect,
  Layer,
  Logger,
  LogLevel,
} from 'effect';
import * as MockConsole from 'test/mock-console.js';

import * as Console from '../index.js';

export const MainLive = Effect.gen(function* ($) {
  const _console = yield* $(MockConsole.make);
  return Layer.mergeAll(EffectConsole.setConsole(_console));
}).pipe(Layer.unwrapEffect);

export const runEffect = async <A, E>(self: Effect.Effect<A, E>): Promise<A> =>
  Effect.provide(self, MainLive).pipe(
    // TODO: test different loglevels
    // Logger.withMinimumLogLevel(LogLevel.All),
    Effect.runPromise,
  );

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Colors = typeof import('../../../packages/console/colors.ts');

describe('Console', () => {
  /**
   * Tests for all the colors in this map
   * @see {@link Colors.logColors logColors}
   */
  it('should print statements with colors', async () => {
    return Effect.gen(function* ($) {
      yield* $(Console.debug('debugs are cyan'));
      yield* $(Console.log('logs are plain'));
      yield* $(Console.info('infos are blue'));
      yield* $(Console.warn('warns are yellow'));
      yield* $(Console.error('errors are red'));
      yield* $(Console.success('success is green'));
      yield* $(Console.successWithSymbol('success is green'));
      yield* $(Console.file('files are 🤷'));

      const lines = yield* $(MockConsole.getLines({ stripAnsi: false }));
      expect(lines).toMatchInlineSnapshot(
        `
        [
          "[36mdebugs are cyan[39m",
          "[37mlogs are plain[39m",
          "[34minfos are blue[39m",
          "[33mwarns are yellow[39m",
          "[31merrors are red[39m",
          "[32msuccess is green[39m",
          "✅",
          "[32msuccess is green[39m",
          "📁 file://files are 🤷",
        ]
      `,
      );
    }).pipe(runEffect);
  });

  /**
   * Tests for all the colors in this map
   * @see {@link Colors.logGroupColors logGroupColors}
   */
  it('should print group headers with backgrounds', async () => {
    return Effect.gen(function* ($) {
      yield* $(
        Console.logGroup(
          'debug',
          'debugs are cyan',
        )('And so are their subtitles'),
      );
      yield* $(
        Console.logGroup('log', 'logs are plain')('And so are their subtitles'),
      );
      yield* $(
        Console.logGroup(
          'info',
          'infos are blue',
        )('And so are their subtitles'),
      );
      yield* $(
        Console.logGroup(
          'warn',
          'warns are yellow',
        )('And so are their subtitles'),
      );
      yield* $(
        Console.logGroup(
          'error',
          'errors are red',
        )('And so are their subtitles'),
      );
      yield* $(
        Console.logGroup(
          'success',
          'success is green',
        )('And so are their subtitles'),
      );

      const lines = yield* $(MockConsole.getLines({ stripAnsi: false }));
      expect(lines).toMatchInlineSnapshot(`
        [
          "[30m[44m debugs are cyan [49m[39m",
          "[36mAnd so are their subtitles[39m",
          "[30m[44m logs are plain [49m[39m",
          "[37mAnd so are their subtitles[39m",
          "[30m[44m infos are blue [49m[39m",
          "[34mAnd so are their subtitles[39m",
          "[30m[43m warns are yellow [49m[39m",
          "[33mAnd so are their subtitles[39m",
          "[30m[41m errors are red [49m[39m",
          "[31mAnd so are their subtitles[39m",
          "[32m[30m[42m success is green [49m[32m[39m",
          "[32m[32mAnd so are their subtitles[32m[39m",
        ]
      `);
    })
      .pipe(Logger.withMinimumLogLevel(LogLevel.All))
      .pipe(runEffect);
  });
});
