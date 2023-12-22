import { Schema as S } from '@effect/schema';
import { Effect } from 'effect';

import BaseConfig from '../../../../public/base.js';
import { ScribeConfig } from '../schema.js';

describe('Base Config', () => {
  it('Parses successfully', () => {
    const result = Effect.runSync(S.parse(ScribeConfig)(BaseConfig));
    expect(result).toMatchInlineSnapshot(`
            {
              "options": {
                "rootOutDir": ".",
                "templatesDirectories": [
                  ".",
                ],
              },
              "templates": {},
            }
          `);
  });
});
