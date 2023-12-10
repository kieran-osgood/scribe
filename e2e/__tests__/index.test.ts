import spawnAsync from '@expo/spawn-async';
import path from 'path';
import stripAnsi from 'strip-ansi';

import packageJson from '../../package.json';
import { arrowKey, createMinimalProject } from '../fixtures';

const cliPath = path.join(process.cwd(), 'dist', 'index.js');
const configFlag = path.join('scribe.config.ts');

describe('Scribe Cli', () => {
  describe('DefaultCommand', () => {
    describe('--config & fully interactive', () => {
      it('should complete successfully', async () => {
        const projectRoot = createMinimalProject();

        const processPromise = spawnAsync(cliPath, [`--config=${configFlag}`], {
          cwd: projectRoot,
        });

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
    });

    describe('--config --template --name', () => {
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

  describe('InitCommand', () => {
    it('should create file', async () => {
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

    describe('should fail', function () {
      it('[Given] if working directory not clean', async () => {
        const cwd = createMinimalProject();

        const t = await spawnAsync(cliPath, ['init'], {
          cwd,
        }).catch(
          async e => e as spawnAsync.SpawnPromise<spawnAsync.SpawnResult>,
        );

        expect(t.stdout).toMatchInlineSnapshot(`
        "We caught an error during execution, this probably isn't a bug.
        Check your 'scribe.config.ts', and ensure all files exist and paths are correct.

        If you think this might be a bug, please report it here: https://github.com/kieran-osgood/scribe/issues/new.

        You can enable verbose logging with --v, --verbose.

        Error: File ${cwd}/scribe.config.ts already exists."
      `);
        expect(t.status).toBe(1);
      });

      // it('[Given]  file already exists', async () => {
      //   const projectRoot = createMinimalProject();
      //
      //   const t = await spawnAsync(cliPath, ['init'], { cwd: projectRoot });
      //
      //   expect(stripAnsi(t.stdout)).toMatchInlineSnapshot();
      //   expect(t.status).toBe(0);
      // });
    });
  });

  describe('HelpCommand', function () {
    it('should print help text', async () => {
      const t = await spawnAsync(cliPath, [`--help`]);

      expect(stripAnsi(t.stdout)).toMatchInlineSnapshot(`
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

      expect(t.status).toBe(0);
    });
  });

  describe('VersionCommand', () => {
    it('should print version', async () => {
      const t = await spawnAsync(cliPath, [`--version`]);
      expect(stripAnsi(t.stdout)).toMatchInlineSnapshot(`
        "${packageJson.version}
        "
      `);
      expect(t.status).toBe(0);
    });
  });
});
