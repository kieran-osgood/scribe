import { Process } from '@scribe/services';
import { Effect } from 'effect';
import { makeProcessMock } from 'src/services/process/process.js';
import { test } from 'vitest';

import { center, file, spacer } from '../formatter.js';

describe('Formatter', () => {
  describe('file()', () => {
    test('empty string', () => {
      const result = file('');
      expect(result).toBe('file://');
    });

    test('any string', () => {
      const result = file('abc');
      expect(result).toBe('file://abc');
    });
  });

  describe('center()', () => {
    const createRuntime = (
      effect: Effect.Effect<Process.Process, never, string>,
    ) =>
      effect.pipe(
        Effect.provideService(Process.Process, makeProcessMock('/mockdir')),
      );

    test('empty string', () => {
      const program = createRuntime(center(''));

      const result = Effect.runSync(program);

      expect(result).toHaveLength(69);
      expect(result).toBe(
        '                                                                     ',
      );
    });

    test('any string', () => {
      const program = createRuntime(center('abc'));

      const result = Effect.runSync(program);

      expect(result).toHaveLength(68);
      expect(result).toBe(
        '                                 abc                                ',
      );
    });
  });

  describe('spacer()', () => {
    test('empty string', () => {
      const result = spacer('');
      expect(result).toBe('  ');
    });

    test('any string', () => {
      const s = 'abc';
      const result = spacer(s);
      expect(result).toHaveLength(s.length + 2);
      expect(result).toBe(` ${s} `);
    });
  });
});
