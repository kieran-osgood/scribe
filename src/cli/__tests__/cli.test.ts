import * as CLI from '@scribe/cli';
import { BaseContext } from 'clipanion/lib/advanced/Cli';
import getStream from 'get-stream';
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
