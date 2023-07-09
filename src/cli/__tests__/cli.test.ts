import * as CLI from '@scribe/cli';
import { BaseContext } from 'clipanion/lib/advanced/Cli';
import * as fs from 'fs';
import getStream from 'get-stream';
import path from 'path';
import { Effect, pipe } from 'src/core';
import { PassThrough, Writable } from 'stream';
import stripAnsi from 'strip-ansi';

import { createMinimalProject } from '../../../e2e/fixtures';

function createCtx(): BaseContext {
  return {
    stdout: new PassThrough(),
    stdin: new PassThrough(),
    env: process.env,
    stderr: process.stderr,
    colorDepth: 0,
  };
}

async function stringifyStdOut(stdout: Writable) {
  return stripAnsi(await getStream(stdout));
}

describe('_Cli', () => {
  describe('Default Command', () => {
    it('should warn on dirty git', async () => {
      const projectRoot = createMinimalProject({
        git: { init: true, dirty: true },
      });
      const ctx = createCtx();

      return pipe(
        Effect.gen(function* ($) {
          const args = [
            '--template=screen',
            '--name=Login',
            `--config=${projectRoot}/scribe.config.ts`,
            `--cwd=${projectRoot}`,
            // `--test=true`,
          ];
          yield* $(CLI.run([...process.argv.slice(0, 2), ...args], ctx));
          ctx.stdout.end();
        }),
        Effect.flatMap(() =>
          Effect.tryPromise(async () => {
            const result = await stringifyStdOut(ctx.stdout);

            expect(result).toMatchInlineSnapshot(`
            "We caught an error during execution, this probably isn't a bug.
            Check your 'scribe.config.ts', and ensure all files exist and paths are correct.

            If you think this might be a bug, please report it here: https://github.com/kieran-osgood/scribe/issues/new.

            You can enable verbose logging with --v, --verbose.

            ⚠️ Working directory not clean"
          `);
          }),
        ),
        Effect.runPromise,
      );
    });

    it('should complete with --template --fileName and relative config path', async () => {
      const projectRoot = createMinimalProject({
        git: { init: true, dirty: false },
      });
      const ctx = createCtx();

      return pipe(
        Effect.gen(function* ($) {
          const args = [
            '--template=screen',
            '--name=Login',
            `--cwd=${projectRoot}`,
          ];
          yield* $(CLI.run([...process.argv.slice(0, 2), ...args], ctx));
          ctx.stdout.end();
          return projectRoot;
        }),
        Effect.flatMap(projectRoot =>
          Effect.tryPromise(async () => {
            const result = await stringifyStdOut(ctx.stdout);

            expect(result).toMatchInlineSnapshot(`
            "✅  Success!
            Output files:
            - ${projectRoot}/examples/src/screens/Login.ts
            - ${projectRoot}/examples/src/screens/Login.test.ts
            "
          `);
          }),
        ),
        Effect.runPromise,
      );
    });

    it('should complete with --template --fileName', async () => {
      const projectRoot = createMinimalProject({
        git: { init: true, dirty: false },
      });
      const ctx = createCtx();

      return pipe(
        Effect.gen(function* ($) {
          const args = [
            '--template=screen',
            '--name=Login',
            `--config=${projectRoot}/scribe.config.ts`,
            `--cwd=${projectRoot}`,
          ];
          yield* $(CLI.run([...process.argv.slice(0, 2), ...args], ctx));
          ctx.stdout.end();
          return projectRoot;
        }),
        Effect.flatMap(projectRoot =>
          Effect.tryPromise(async () => {
            const result = await stringifyStdOut(ctx.stdout);

            expect(result).toMatchInlineSnapshot(`
            "✅  Success!
            Output files:
            - ${projectRoot}/examples/src/screens/Login.ts
            - ${projectRoot}/examples/src/screens/Login.test.ts
            "
          `);
          }),
        ),
        Effect.runPromise,
      );
    });
  });

  describe('Init Command', () => {
    it('should write base config file', async () => {
      const projectRoot = createMinimalProject({
        git: { init: true, dirty: false },
        fixtures: {
          configFile: false,
          templateFiles: false,
        },
      });
      const ctx = createCtx();

      return pipe(
        Effect.gen(function* ($) {
          const args = ['init', `--cwd=${projectRoot}`];
          yield* $(CLI.run([...process.argv.slice(0, 2), ...args], ctx));
          ctx.stdout.end();
          return projectRoot;
        }),
        Effect.flatMap(projectRoot =>
          Effect.tryPromise(async () => {
            const result = await stringifyStdOut(ctx.stdout);
            expect(result).toMatchInlineSnapshot(
              `"Scribe config created: ${projectRoot}/scribe.config.ts"`,
            );

            const file = fs.readFileSync(
              path.join(projectRoot, 'scribe.config.ts'),
            );
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
          }),
        ),
        Effect.runPromise,
      );
    });

    it.only("should fail if file doesn't exist", async ctx => {
      const projectRoot = createMinimalProject({
        git: { init: true, dirty: false },
        fixtures: {
          configFile: true,
          templateFiles: false,
        },
      });
      const cliCtx = createCtx();

      return pipe(
        Effect.gen(function* ($) {
          const args = ['init', `--cwd=${projectRoot}`];
          yield* $(CLI.run([...process.argv.slice(0, 2), ...args], cliCtx));
          cliCtx.stdout.end();

          const result = yield* $(
            Effect.tryPromise(() => stringifyStdOut(cliCtx.stdout)),
          );

          ctx.expect(result).toMatchInlineSnapshot(`
              "We caught an error during execution, this probably isn't a bug.
              Check your 'scribe.config.ts', and ensure all files exist and paths are correct.

              If you think this might be a bug, please report it here: https://github.com/kieran-osgood/scribe/issues/new.

              You can enable verbose logging with --v, --verbose.

              Error: File ${projectRoot}/scribe.config.ts already exists."
            `);
        }),
        Effect.runPromise,
      );
    });
  });
  describe('Help Command', () => {
    it('should print --help', async () => {
      const ctx = createCtx();

      return pipe(
        Effect.gen(function* ($) {
          const args = ['--help'];
          yield* $(CLI.run([...process.argv.slice(0, 2), ...args], ctx));
          ctx.stdout.end();
        }),
        Effect.flatMap(() =>
          Effect.tryPromise(async () => {
            const result = await stringifyStdOut(ctx.stdout);
            expect(result).toMatchInlineSnapshot(`
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
          }),
        ),
        Effect.runPromise,
      );
    });
  });
});

/**
 *
 *
 const file = fs.readFileSync(
 path.join(projectRoot, 'scribe.config.ts'),
 );
 expect(String(file)).toMatchInlineSnapshot(`
 "import type { ScribeConfig } from '@scribe/config';

 const config = {
                options: {
                  rootOutDir: '.',
                  templatesDirectories: ["./test-fixtures"],
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
 */
