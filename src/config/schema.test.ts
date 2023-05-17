import { S } from '@scribe/core';
import BaseConfig from './base';
import { ScribeConfig } from './schema';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Config', () => {
  describe('base', () => {
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

    it('throws with invalid config', () => {
      expect(() => S.parse(ScribeConfig)({}))
        .toThrowErrorMatchingInlineSnapshot(`
        "error(s) found
        └─ [\\"templates\\"]
           └─ is missing"
      `);
    });
  });
});
