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

    const result = Effect.runSync(S.decodeUnknown(ScribeConfig)(config));
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
    const result = Effect.runSync(
      pipe(S.decodeUnknown(ScribeConfig)({}), Effect.flip),
    );
    expect(String(result)).toMatchInlineSnapshot(`
      "{ options?: { rootOutDir: string; templatesDirectories: ReadonlyArray<string> } | undefined; templates: { [x: string]: { output?: { directory?: string | undefined } | undefined; outputs: ReadonlyArray<{ templateFileKey: string; output: { directory: string; fileName: string } }> } } }
      └─ ["templates"]
         └─ is missing"
    `);
  });
});
