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
            directory: '',
            fileName: '',
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
              "directory": "",
              "fileName": "",
              "key": "",
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
      "{ templatesDirectories: ReadonlyArray<string>; generators: { [x: string]: ReadonlyArray<{ key: string; directory: string; fileName: string }> } }
      └─ ["templatesDirectories"]
         └─ is missing"
    `);
  });
});
