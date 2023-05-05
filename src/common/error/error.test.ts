import { fmtError } from './error';
import { pipe } from '@scribe/core';
import { ZodError } from 'zod';
import { describe } from 'vitest';
import * as fc from 'fast-check';
import * as S from 'fp-ts/lib/string';

describe('formatErrorMessage', () => {
  it('should format the errors if it was a Error instance', () => {
    pipe(new Error('An error instance!'), fmtError, e =>
      expect(e).toBe('An error instance!')
    );
  });

  it('should return the error.message if it was a ZodError instance', () => {
    pipe(
      new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['test'],
          message: 'Expected a string but you sent a number?',
        },
      ]),
      fmtError,
      e =>
        expect(e).toMatchInlineSnapshot(
          '"{\\"_errors\\":[],\\"test\\":{\\"_errors\\":[\\"Expected a string but you sent a number?\\"]}}"'
        )
    );
  });

  it('non Error values should stringify', () =>
    fc.assert(
      fc.property(fc.anything({ withObjectString: true }), _ =>
        S.Eq.equals(fmtError(_), String(_))
      )
    ));
});
