import * as CLI from '@scribe/cli';
import { BaseContext } from 'clipanion/lib/advanced/Cli';
import * as fs from 'fs';
import getStream from 'get-stream';
import path from 'path';
import { Effect, pipe } from 'src/core';
import { PassThrough, Writable } from 'stream';
import stripAnsi from 'strip-ansi';
import { test } from 'vitest';

import { createMinimalProject } from '../../../e2e/fixtures';

const createCtx = (): BaseContext => ({
  stdout: new PassThrough(),
  stdin: new PassThrough(),
  env: process.env,
  stderr: process.stderr,
  colorDepth: 0,
});

interface MyFixtures {
  cliCtx: BaseContext;
}

const CliTest = test.extend<MyFixtures>({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cliCtx: async ({ task }, use) => {
    const ctx = createCtx();
    // use the fixture value
    await use(ctx);
  },
});

const parseWritable = (writeable: Writable) => {
  return Effect.tryPromise(async () => stripAnsi(await getStream(writeable)));
};

describe('_Cli', () => {
  describe('Default Command', () => {
    CliTest('should warn on dirty git', async ({ cliCtx, expect }) => {
      const projectRoot = createMinimalProject({
        git: { init: true, dirty: true },
      });

      const result = pipe(
        Effect.gen(function* ($) {
          const args = [
            '--template=screen',
            '--name=Login',
            `--config=${projectRoot}/scribe.config.ts`,
            `--cwd=${projectRoot}`,
          ];
          yield* $(CLI.run([...process.argv.slice(0, 2), ...args], cliCtx));
          cliCtx.stdout.end();
          return yield* $(parseWritable(cliCtx.stdout));
        }),
        Effect.runPromise,
      );

      expect(await result).toMatchInlineSnapshot(`
            "We caught an error during execution, this probably isn't a bug.
            Check your 'scribe.config.ts', and ensure all files exist and paths are correct.

            If you think this might be a bug, please report it here: https://github.com/kieran-osgood/scribe/issues/new.

            You can enable verbose logging with --v, --verbose.

            ⚠️ Working directory not clean"
          `);
    });

    CliTest(
      'should complete with --template --fileName and relative config path',
      async ({ cliCtx, expect }) => {
        const projectRoot = createMinimalProject({
          git: { init: true, dirty: false },
        });

        const result = pipe(
          Effect.gen(function* ($) {
            const args = [
              '--template=screen',
              '--name=Login',
              `--cwd=${projectRoot}`,
            ];
            yield* $(CLI.run([...process.argv.slice(0, 2), ...args], cliCtx));
            cliCtx.stdout.end();
            return yield* $(parseWritable(cliCtx.stdout));
          }),
          Effect.runPromise,
        );

        expect(await result).toMatchInlineSnapshot(`
            "✅  Success!
            Output files:
            - ${projectRoot}/examples/src/screens/Login.ts
            - ${projectRoot}/examples/src/screens/Login.test.ts
            "
          `);
      },
    );

    CliTest(
      'should complete with --template --fileName',
      async ({ cliCtx, expect }) => {
        const projectRoot = createMinimalProject({
          git: { init: true, dirty: false },
        });

        const result = pipe(
          Effect.gen(function* ($) {
            const args = [
              '--template=screen',
              '--name=Login',
              `--config=${projectRoot}/scribe.config.ts`,
              `--cwd=${projectRoot}`,
            ];
            yield* $(CLI.run([...process.argv.slice(0, 2), ...args], cliCtx));
            cliCtx.stdout.end();
            return yield* $(parseWritable(cliCtx.stdout));
          }),
          Effect.runPromise,
        );

        expect(await result).toMatchInlineSnapshot(`
            "✅  Success!
            Output files:
            - ${projectRoot}/examples/src/screens/Login.ts
            - ${projectRoot}/examples/src/screens/Login.test.ts
            "
          `);
      },
    );
  });

  describe('Init Command', () => {
    CliTest('should write base config file', async ({ cliCtx, expect }) => {
      const projectRoot = createMinimalProject({
        git: { init: true, dirty: false },
        fixtures: {
          configFile: false,
          templateFiles: false,
        },
      });

      const result = pipe(
        Effect.gen(function* ($) {
          const args = ['init', `--cwd=${projectRoot}`];
          yield* $(CLI.run([...process.argv.slice(0, 2), ...args], cliCtx));
          cliCtx.stdout.end();
          return yield* $(parseWritable(cliCtx.stdout));
        }),
        Effect.runPromise,
      );

      expect(await result).toMatchInlineSnapshot(
        `"Scribe config created: ${projectRoot}/scribe.config.ts"`,
      );

      const file = fs.readFileSync(path.join(projectRoot, 'scribe.config.ts'));
      expect(String(file)).toMatchInlineSnapshot(`
              "import { ScribeConfig } from './index.js';

              const BaseConfig = {
                options: {
                  rootOutDir: '.',
                  templatesDirectories: ['.'],
                },
                templates: {},
              } satisfies ScribeConfig;

              export default BaseConfig;
              "
            `);
    });

    CliTest("should fail if file doesn't exist", async ({ cliCtx, expect }) => {
      const projectRoot = createMinimalProject({
        git: { init: true, dirty: false },
        fixtures: {
          configFile: true,
          templateFiles: false,
        },
      });

      const result = pipe(
        Effect.gen(function* ($) {
          const args = ['init', `--cwd=${projectRoot}`];
          yield* $(CLI.run([...process.argv.slice(0, 2), ...args], cliCtx));
          cliCtx.stdout.end();

          return yield* $(parseWritable(cliCtx.stdout));
        }),
        Effect.runPromise,
      );

      expect(await result).toMatchInlineSnapshot(`
              "We caught an error during execution, this probably isn't a bug.
              Check your 'scribe.config.ts', and ensure all files exist and paths are correct.

              If you think this might be a bug, please report it here: https://github.com/kieran-osgood/scribe/issues/new.

              You can enable verbose logging with --v, --verbose.

              Error: File ${projectRoot}/scribe.config.ts already exists."
            `);

      const file = fs.readFileSync(path.join(projectRoot, 'scribe.config.ts'));
      expect(String(file)).toMatchInlineSnapshot(`
        "import type { ScribeConfig } from '@scribe/config';

        const config = {
          options: {
            rootOutDir: '.',
            templatesDirectories: ['./test-fixtures'],
          },
          templates: {
            component: {
              outputs: [
                {
                  templateFileKey: 'component',
                  output: {
                    directory: 'examples/src/components',
                    fileName: '{{Name}}.ts',
                  },
                },
              ],
            },
            screen: {
              outputs: [
                {
                  templateFileKey: 'screen',
                  output: {
                    directory: 'examples/src/screens',
                    fileName: '{{Name}}.ts',
                  },
                },
                {
                  templateFileKey: 'screen.test',
                  output: {
                    directory: 'examples/src/screens',
                    fileName: '{{Name}}.test.ts',
                  },
                },
              ],
            },
          },
        } satisfies ScribeConfig;

        export default config;
        "
      `);
    });
  });

  describe('Help Command', () => {
    CliTest('should print --help', async ({ cliCtx, expect }) => {
      const result = pipe(
        Effect.gen(function* ($) {
          const args = ['--help'];
          yield* $(CLI.run([...process.argv.slice(0, 2), ...args], cliCtx));
          cliCtx.stdout.end();
          return yield* $(parseWritable(cliCtx.stdout));
        }),
        Effect.runPromise,
      );

      expect(await result).toMatchInlineSnapshot(`
        "━━━ scribe ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          $ scribe <command>

        ━━━ General commands ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

          scribe [-c,--config #0] [--verbose] [-n,--name #0] [-t,--template #0]
            Scribe generates files based on mustache templates.

          scribe init [-c,--config #0] [--verbose]
            Generates a scribe.config.ts file.

        You can also print more details about any of these commands by calling them with 
        the \`-h,--help\` flag right after the command name.
        "
      `);
    });
  });
});
