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

describe('_Cli', () => {
  it('should accept template & fileName and complete', async () => {
    const projectRoot = createMinimalProject();
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
        // TODO: spyon process.exit
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
        })
      ),
      Effect.runPromise
    );
  });

  // it.only(
  //   'should fail with cause',
  //   async () => {
  //     const projectRoot = createMinimalProject();
  //     const args = [
  //       '--config=./test/config/blarghhh',
  //       '--template=blarghh',
  //       '--name=blarghh',
  //     ];
  //     const ctx = createCtx();
  //
  //     // ctx.stdout.pipe(process.stdout);
  //     // ctx.stderr.pipe(process.stderr);
  //
  //     return pipe(
  //       Effect.gen(function* ($) {
  //         const result = yield* $(
  //           CLI.run([...process.argv.slice(0, 2), ...args], ctx),
  //           Effect.flip
  //         );
  //         console.log({ result });
  //         expect(result).toBeInstanceOf(CliError);
  //         return projectRoot;
  //       }),
  //       Effect.flatMap(() => Effect.tryPromise(() => getStream(ctx.stdout))),
  //       Effect.map(_ => {
  //         expect(stripAnsi(_)).toMatchInlineSnapshot();
  //       }),
  //       Effect.runPromise
  //     );
  //   },
  //   { timeout: 3000 }
  // );
});

// REMOVE - Discord example
// it('should accept template & fileName and complete', async () => {
//   const args = [
//     '--config=./test/config/good-scribe.config.ts',
//     '--template=screen',
//     '--name=Login',
//   ];
//   const ctx = createCtx();
//
//   return pipe(
//     Effect.gen(async function* ($) {
//       const oldArgv = process.argv;
//       process.argv = [...oldArgv.slice(0, 2), ...args];
//
//       yield* $(CLI.run(ctx));
//       ctx.stdout.end();
//
//       const result = yield await getStream(ctx.stdout);
//       expect(stripAnsi(result)).toMatchInlineSnapshot();
//     }),
//     Effect.runPromise
//   );
// });

// or no git repo?
// it.only('should log dirty tree if user has changes', async () => {
//   const passThrough = new PassThrough();
//   const stdin = new PassThrough();
//   process.env.NODE_ENV = 'production';
//   await _Cli(['--name=Login --template=screen'], {
//     stdout: passThrough,
//     stdin,
//   });
//   passThrough.end();
//
//   expect(await getStream(passThrough)).toMatchInlineSnapshot('"⚠️ Working directory not clean"');
// });
// it('should print default usage info', async () => {
//   const passThrough = new PassThrough();
//   await _Cli([''], {
//     stdout: passThrough,
//   });
//   passThrough.end();
//
//   expect(await getStream(passThrough)).toMatchSnapshot();
// });
//
// it('should print help info', async () => {
//   const passThrough = new PassThrough();
//   await _Cli(['--help'], {
//     stdout: passThrough,
//   });
//   passThrough.end();
//
//   expect(await getStream(passThrough)).toMatchSnapshot();
// });

// it.skip('should accept name as argument and prompt for template', async () => {
//   const stdout = new PassThrough();
//   await _Cli(['--name=Login --config=./test/config/good-scribe.config.ts'], {
//     stdout,
//   });
//   stdout.end();
//
//   const result = await getStream(stdout);
//   console.log(result);
// });
//
// it.skip('should accept template as argument and prompt for name', async () => {
//   const stdout = new PassThrough();
//   await _Cli(['--template=screen'], {
//     stdout,
//   });
//   stdout.end();
//
//   expect(await getStream(stdout)).toMatchSnapshot();
// });

async function stringifyStdOut(stdout: Writable) {
  return stripAnsi(await getStream(stdout));
}
