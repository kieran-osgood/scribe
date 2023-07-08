import spawnAsync from '@expo/spawn-async';
import path from 'path';
import stripAnsi from 'strip-ansi';

import { arrowKey, createMinimalProject } from '../fixtures';

const cliPath = path.join(process.cwd(), 'dist', 'index.js');
const configFlag = path.join('scribe.config.ts');

describe('Scribe Cli', () => {
  describe('--help', function () {
    it('should print help text', async () => {
      const t = await spawnAsync(cliPath, [`--help`]);

      expect(stripAnsi(t.stdout)).toMatchInlineSnapshot(`
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

      expect(t.status).toBe(0);
    });
  });

  describe('--config & fully interactive', () => {
    it('should complete successfully', async () => {
      const projectRoot = createMinimalProject();

      const processPromise = spawnAsync(
        cliPath,
        [
          `--config=${configFlag}`, //
        ],
        { cwd: projectRoot },
      );

      const cli = processPromise.child;

      if (cli === null) {
        throw new Error('spawned process is null');
      }
      // cli.stderr?.pipe(process.stderr);

      cli.stdout?.on('data', (data: { toString(): string }) => {
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
          'Complete\n',
      );
      expect(result.status).toBe(0);
    });

    describe('--template --name', () => {
      it('should complete successfully', async () => {
        const projectRoot = createMinimalProject();

        const result = await spawnAsync(
          cliPath,
          [`--config=${configFlag}`, '--template=screen', '--name=Login'],
          { cwd: projectRoot },
        );

        const stdOutAnsi = stripAnsi(result.stdout);
        expect(stdOutAnsi).toMatch(
          '✅  Success!\n' +
            'Output files:\n' +
            `- ${projectRoot}/examples/src/screens/Login.ts\n` +
            `- ${projectRoot}/examples/src/screens/Login.test.ts\n` +
            'Complete\n',
        );
        expect(result.status).toBe(0);
      });
    });
  });
});
