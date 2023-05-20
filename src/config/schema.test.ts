import { S } from '@scribe/core';
import BaseConfig from './base';
import { ScribeConfig } from './schema';

describe('Config', () => {
  describe('BaseConfig', () => {
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
  describe('Config', () => {
    it('Parses successfully with templates', () => {
      const config: ScribeConfig = {
        options: {
          rootOutDir: '.',
          templatesDirectories: ['.'],
        },
        templates: {
          screen: {
            outputs: [
              {
                templateFileKey: '',
                output: { directory: '', fileName: '' },
              },
            ],
          },
        },
      };

      const result = S.parse(ScribeConfig)(config);
      expect(result).toMatchInlineSnapshot(`
        {
          "options": {
            "rootOutDir": ".",
            "templatesDirectories": [
              ".",
            ],
          },
          "templates": {
            "screen": {
              "outputs": [
                {
                  "output": {
                    "directory": "",
                    "fileName": "",
                  },
                  "templateFileKey": "",
                },
              ],
            },
          },
        }
      `);
    });
  });
  it('throws with invalid config', () => {
    expect(() => S.parse(ScribeConfig)({})).toThrowErrorMatchingInlineSnapshot(`
        "error(s) found
        └─ [\\"templates\\"]
           └─ is missing"
      `);
  });
});
