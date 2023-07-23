import { pipe, String } from '@scribe/core';
import * as fc from 'fast-check';
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
        String.Equivalence(
          fmtError(_),
          typeof _?.toString === 'function' ? _?.toString() : 'Unknown Error',
        ),
      ),
      { seed: 1734679579, path: '8:1:78:78', endOnFailure: true },
    ));
});
