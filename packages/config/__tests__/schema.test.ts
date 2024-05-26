import * as S from '@effect/schema/Schema';
import { Effect } from 'effect';

import { ScribeConfig } from '../schema.js';

describe('Config', () => {
  it('Parses successfully with templates', () => {
    const config: ScribeConfig = {
      templatesDirectories: ['.'],
      generators: {
        screen: [
          {
            key: '',
            output: { directory: '', fileName: '' },
          },
        ],
      },
    };

    const result = Effect.runSync(S.decodeUnknown(ScribeConfig)(config));
    expect(result).toMatchInlineSnapshot(`
      {
        "generators": {
          "screen": [
            {
              "key": "",
              "output": {
                "directory": "",
                "fileName": "",
              },
            },
          ],
        },
        "templatesDirectories": [
          ".",
        ],
      }
    `);
  });

  it('throws with invalid config', () => {
    const result = Effect.runSync(
      S.decodeUnknown(ScribeConfig)({}).pipe(Effect.flip),
    );
    expect(String(result)).toMatchInlineSnapshot(`
      "{ templatesDirectories: ReadonlyArray<string>; generators: { [x: string]: ReadonlyArray<{ key: string; output: { directory: string; fileName: string } }> } }
      └─ ["templatesDirectories"]
         └─ is missing"
    `);
  });
});
