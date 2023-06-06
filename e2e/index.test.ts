import { prepareEnvironment } from '@gmrchk/cli-testing-library';
import path from 'path';
import child from 'child_process';
import spawnAsync from '@expo/spawn-async';
import stripAnsi from 'strip-ansi';
import * as tempy from 'tempy';
import * as fs from 'fs';

const projectRoot = tempy.temporaryDirectory();
const cliPath = path.join(process.cwd(), 'dist', 'index.js');
const configFlag = path.join('scribe.config.ts');

const readAndWriteFixture = (writePath: string, readPath: string) => {
  const _writePath = path.join(projectRoot, writePath);
  fs.writeFileSync(_writePath, fs.readFileSync(readPath));
};

beforeAll(() => {
  fs.mkdirSync(path.join(projectRoot, 'test'));
  readAndWriteFixture('scribe.config.ts', './test/scribe.config.ts');
  readAndWriteFixture('./test/screen.scribe', './test/screen.scribe');
  readAndWriteFixture('./test/screen.test.scribe', './test/screen.scribe');
});

const arrowKey = {
  up: '\u001b[A',
  down: '\u001b[B',
  left: '\u001b[D',
  right: '\u001b[C',
};
describe('Scribe Cli', () => {
  describe('--help', function () {
    it('should print help text', async () => {
      const e = await prepareEnvironment();

      const t = await e.execute('node', `${cliPath} --help`);

      console.log(t.stdout);
      expect(t.stdout.join('\n')).toMatchInlineSnapshot(`
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
      Exiting"
    `);
      expect(t.stderr).toStrictEqual([]);
      expect(t.code).toBe(0);

      await e.cleanup();
    });
  });

  // const stdin = mockStdin.stdin();

  it('CMON', () =>
    new Promise<void>(done => {
      const exec = path.join(__dirname, '../dist', 'index.js');
      const proc = child.spawn(exec, ['--config=test/scribe.config.ts'], {
        stdio: 'pipe',
      });
      proc.stderr.on('data', function (error) {
        console.log(error);
        throw new Error('stderr ');
      });
      proc.stdout.once('data', function () {
        proc.stdin.write('\r');
        proc.stdout.once('data', d => {
          proc.stdin.write('Login\r');
          console.log('d', String(d));
          done();
          // (async () => {
          //   console.log('data', await getStream(d));
          //   console.log(await getStream(proc.stdout));
          //   done();
          // })();
        });
      });

      // console.log(await getStream(proc.stdout));
    }));

  // it('should run to success!', async () => {
  //   const exec = path.join(__dirname, '../dist', 'index.js');
  //   const proc = child.spawn(
  //     exec,
  //     ['--config=test/scribe.config.ts', '--name=Login', '--template=screen'],
  //     { stdio: 'pipe' }
  //   );
  //
  //   console.log(await getStream(proc.stdout));
  // });

  describe.only('--template --name', () => {
    it('should complete successfully', async () => {
      const processPromise = spawnAsync(
        cliPath,
        [
          `--config=${configFlag}`, //
        ],
        { cwd: projectRoot }
      );

      const cli = processPromise.child;

      if (cli === null) {
        throw new Error('spawned process is null');
      }
      // cli.stderr?.pipe(process.stderr);

      cli.stdout?.on('data', data => {
        if (/Pick your template/.test(data.toString())) {
          cli.stdin?.write(`${arrowKey.down}\n`);
        } else if (/File name/.test(data.toString())) {
          cli.stdin?.write('Login\n');
        } else {
          // console.log(data.toString());
        }
      });
      // .pipe(process.stdout);

      const result = await processPromise;

      const stdOutAnsi = stripAnsi(result.stdout);
      expect(stdOutAnsi).toMatch(
        '✅  Success!\n' +
          'Output files:\n' +
          `- ${projectRoot}/examples/src/screens/Login.ts\n` +
          `- ${projectRoot}/examples/src/screens/Login.test.ts\n` +
          'Complete\n' +
          'Exiting'
      );
      expect(result.status).toBe(0);
    });
  });
});
