import { S } from '@scribe/core';
import BaseConfig from '../base';
import { ScribeConfig } from '../schema';

describe('Base Config', () => {
  it('Parses successfully', () => {
    const result = S.parse(ScribeConfig)(BaseConfig);
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
