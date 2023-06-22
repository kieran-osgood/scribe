import * as CLI from '@scribe/cli';
import { Effect, pipe } from '@scribe/core';
import getStream from 'get-stream';
import { BaseContext } from 'clipanion/lib/advanced/Cli';
import stripAnsi from 'strip-ansi';
import { PassThrough, Writable } from 'stream';
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
        ];
        yield* $(CLI.run([...process.argv.slice(0, 2), ...args], ctx));
        ctx.stdout.end();
      }),
      Effect.flatMap(() =>
        Effect.tryPromise(async () => {
          const result = await stringifyStdOut(ctx.stdout);

          expect(result).toBe('⚠️ Working directory not clean\n');
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
            Complete
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
            "Scribe generates files based on mustache templates.

            ━━━ Usage ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            $ scribe

            ━━━ Options ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

              -c,--config #0      Path to the config (default: scribe.config.ts)
              --verbose           More verbose logging and error stack traces
              -n,--name #0        The key of templates to generate.
              -t,--template #0    Specify the name of the template to generate. Must be a key under templates in config.

            ━━━ Examples ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            Interactively select template to use
              $ scribe

            Select via args
              $ scribe --template screen --name Login
            "
          `);
        }),
      ),
      Effect.runPromise,
    );
  });
});
