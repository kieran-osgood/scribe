import { _Cli } from '@scribe/cli';
import { PassThrough } from 'stream';
import getStream from 'get-stream';
import { BaseContext } from 'clipanion/lib/advanced/Cli';
import memfs from 'memfs';
import * as fs from 'fs';
import path from 'path';

vi.mock('simple-git', () => ({
  default: () => ({
    status(_: unknown, cb: (_: null, opts: { isClean(): boolean }) => void) {
      cb(null, { isClean: () => true });
    },
  }),
}));

// vi.mock('cosmiconfig', () => ({
//   cosmiconfig: () => ({
//     load() {
//       return Promise.resolve({
//         config: config,
//         filePath: 'scribe.config.ts',
//         isEmpty: false,
//       });
//     },
//   }),
// }));
//
beforeEach(() => {
  memfs.vol.mkdirSync(process.cwd(), { recursive: true });
  memfs.vol.mkdirSync(path.join(process.cwd(), 'test'), { recursive: true });

  memfs.vol.writeFileSync(
    path.join(process.cwd(), 'scribe.config.ts'),
    fs.readFileSync(
      path.join(process.cwd(), 'test/config/good-scribe.config.ts')
    )
  );
  memfs.vol.writeFileSync(
    path.join(process.cwd(), 'screen.scribe'),
    fs.readFileSync('test/screen.scribe')
  );
  memfs.vol.writeFileSync(
    path.join(process.cwd(), 'screen.test.scribe'),
    fs.readFileSync('test/screen.test.scribe')
  );
});

afterEach(() => memfs.vol.reset());

beforeAll(() => {
  process.env.NODE_ENV = 'production';
});

afterAll(() => {
  process.env.NODE_ENV = 'test';
});

vitest.mock('process', () => ({
  cwd: () => 'mockdir',
}));

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

  it.only('should accept template & fileName and complete', async () => {
    const ctx = createCtx();
    const args = [
      '--config=./test/config/good-scribe.config.ts',
      '--template=screen',
      '--name=Login',
    ];

    await _Cli(args, ctx);
    ctx.stdout.end();

    const result = await getStream(ctx.stdout);
    expect(result).toMatchInlineSnapshot(`
  "[32m✅  Success!
  [39mOutput files:
  - /Users/kieranosgood/WebstormProjects/scribe/examples/src/screens/Login.ts
  - /Users/kieranosgood/WebstormProjects/scribe/examples/src/screens/Login.test.ts
  Complete"
`);
  });

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
});
