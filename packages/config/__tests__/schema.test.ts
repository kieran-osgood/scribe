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
            templateFileKey: '',
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
              "output": {
                "directory": "",
                "fileName": "",
              },
              "templateFileKey": "",
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
      "{ templatesDirectories: ReadonlyArray<string>; generators: { [x: string]: ReadonlyArray<{ templateFileKey: string; output: { directory: string; fileName: string } }> } }
      └─ ["templatesDirectories"]
         └─ is missing"
    `);
  });
});
