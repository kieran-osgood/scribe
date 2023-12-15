import { BaseContext } from 'clipanion/lib/advanced/Cli';
import { Effect, pipe } from 'effect';
import * as fs from 'fs';
import getStream from 'get-stream';
import path from 'path';
import { PassThrough, Writable } from 'stream';
import stripAnsi from 'strip-ansi';
import { describe, test } from 'vitest';

import { createMinimalProject } from '../../../e2e/fixtures';
import packageJson from '../../../package.json';
import * as CLI from '../cli';

const createCtx = (): BaseContext => ({
  stdout: new PassThrough(),
  stdin: new PassThrough(),
  env: process.env,
  stderr: process.stderr,
  colorDepth: 0,
});

type CliTestFixtures = {
  cliCtx: BaseContext;
};
const CliTest = test.extend<CliTestFixtures>({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  cliCtx: async ({ task }, use) => {
    const ctx = createCtx();
    await use(ctx);
  },
});

const parseWritable = (writeable: Writable) =>
  Effect.tryPromise(async () => stripAnsi(await getStream(writeable)));

type RunCliPromise = {
  cliCtx: BaseContext;
  args: string[];
};
const runCli = async ({ cliCtx, args }: RunCliPromise) =>
  pipe(
    Effect.gen(function* ($) {
      yield* $(CLI.run([...process.argv.slice(0, 2), ...args], cliCtx));
      cliCtx.stdout.end();
      return yield* $(parseWritable(cliCtx.stdout));
    }),
    Effect.runPromise,
  );

describe('_Cli', () => {
  describe.skip('Default Command', () => {
    CliTest('should warn on dirty git', async ({ cliCtx, expect }) => {
      const projectRoot = createMinimalProject({
        git: { init: true, dirty: true },
      });
      const args = [
        '--template=screen',
        '--name=Login',
        `--config=${projectRoot}/scribe.config.ts`,
        `--cwd=${projectRoot}`,
      ];

      const result = runCli({ cliCtx, args });

      expect(await result).toMatchInlineSnapshot(`
            "We caught an error during execution, this probably isn't a bug.
            Check your 'scribe.config.ts', and ensure all files exist and paths are correct.

            If you think this might be a bug, please report it here: https://github.com/kieran-osgood/scribe/issues/new.

            You can enable verbose logging with --v, --verbose.

            ⚠️ Working directory not clean"
          `);
    });

    // TODO: fix logic so this test runs without the <rootDir>/scribe.config.ts
    CliTest(
      'should complete with --template --fileName and relative config path',
      async ({ cliCtx, expect }) => {
        const projectRoot = createMinimalProject({
          git: { init: true, dirty: false },
        });
        const args = [
          '--template=screen',
          '--name=Login',
          `--cwd=${projectRoot}`,
          '--verbose',
        ];

        const result = runCli({ cliCtx, args });

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
        const args = [
          '--template=screen',
          '--name=Login',
          `--config=${projectRoot}/scribe.config.ts`,
          `--cwd=${projectRoot}`,
        ];

        const result = runCli({ cliCtx, args });

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
    describe('[Given] git is clean', () => {
      CliTest('should write base config file', async ({ cliCtx, expect }) => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: false },
          fixtures: {
            configFile: false,
            templateFiles: false,
            base: false,
          },
        });

        const args = ['init', `--cwd=${cwd}`];

        const result = await runCli({ cliCtx, args });
        expect(result).toMatchInlineSnapshot(
          `"Init
 Git 
Checking working tree clean
 Config 
Checking write path clear
Writing...
 Success 
✅  Scribe init complete. Edit the config to begin templating.
📁 file://${cwd}/scribe.config.ts
"`,
        );

        const file = fs.readFileSync(path.join(cwd, 'scribe.config.ts'));
        expect(String(file)).toMatchSnapshot();
      });

      CliTest(
        "should fail if file doesn't exist",
        async ({ cliCtx, expect }) => {
          const cwd = createMinimalProject({
            git: { init: true, dirty: false },
            fixtures: { configFile: true, templateFiles: false, base: false },
          });
          const args = ['init', `--cwd=${cwd}`];

          const result = await runCli({ cliCtx, args });

          expect(result).toMatchInlineSnapshot(
            `"Init
 Git 
Checking working tree clean
 Config 
Checking write path clear
💥 Failed to create config. Path not empty.
📁 file://${cwd}/scribe.config.ts
"`,
          );

          const file = fs.readFileSync(path.join(cwd, 'scribe.config.ts'));
          expect(String(file)).toMatchSnapshot();
        },
      );
    });
  });

  describe('Help Command', () => {
    CliTest('should print --help', async ({ cliCtx, expect }) => {
      const args = ['--help'];

      const result = runCli({ cliCtx, args });

      expect(await result).toMatchInlineSnapshot(`
        "━━━ scribe - ${packageJson.version} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
