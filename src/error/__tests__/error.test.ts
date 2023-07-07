import * as fc from 'fast-check';
import * as S from 'fp-ts/lib/string';
import { pipe } from 'src/core';
import { describe } from 'vitest';

import { fmtError } from '../error';

describe('formatErrorMessage', () => {
  it('should format the errors if it was a Error instance', () => {
    pipe(new Error('An error instance!'), fmtError, e =>
      expect(e).toBe('An error instance!'),
    );
  });

  it('non Error values should stringify', () =>
    fc.assert(
      fc.property(fc.anything({ withObjectString: true }), _ =>
        S.Eq.equals(
          fmtError(_),
          typeof _?.toString === 'function' ? _?.toString() : 'Unknown Error',
        ),
      ),
      { seed: 1734679579, path: '8:1:78:78', endOnFailure: true },
    ));
});
