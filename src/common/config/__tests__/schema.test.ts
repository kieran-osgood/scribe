import { Schema as S } from '@effect/schema';
import { Effect, pipe } from 'effect';

import { ScribeConfig } from '../schema.js';

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

    const result = Effect.runSync(S.parse(ScribeConfig)(config));
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

  it('throws with invalid config', () => {
    const result = Effect.runSync(pipe(S.parse(ScribeConfig)({}), Effect.flip));
    expect(String(result)).toMatchInlineSnapshot(`
      "error(s) found
      └─ ["templates"]
         └─ is missing"
    `);
  });
});
