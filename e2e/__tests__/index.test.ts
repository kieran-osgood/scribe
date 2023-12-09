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

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cli === null) {
        throw new Error('spawned process is null');
      }
      // cli.stderr?.pipe(process.stderr);

      cli.stdout?.on('data', (data: { toString(): string }) => {
        if (data.toString().includes('Pick your template')) {
          cli.stdin?.write(`${arrowKey.down}\n`);
        } else if (data.toString().includes('File name')) {
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
          `- ${projectRoot}/examples/src/screens/Login.test.ts\n`,
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
            `- ${projectRoot}/examples/src/screens/Login.test.ts\n`,
        );
        expect(result.status).toBe(0);
      });
    });
  });
});
