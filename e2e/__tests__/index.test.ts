import spawnAsync from '@expo/spawn-async';
import path from 'path';
import stripAnsi from 'strip-ansi';

import packageJson from '../../package.json';
import { arrowKey, createMinimalProject } from '../fixtures';

const cliPath = path.join(process.cwd(), 'dist', 'index.js');
const configFlag = path.join('scribe.config.ts');

describe('DefaultCommand', () => {
  describe('--config & fully interactive', () => {
    it('should complete successfully', async () => {
      const cwd = createMinimalProject();

      const processPromise = spawnAsync(cliPath, [`--config=${configFlag}`], {
        cwd,
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

      expect(result.status).toBe(0);
      expect(stripAnsi(result.stdout)).toMatch(
        '✅  Success!\n' +
          'Output files:\n' +
          `- ${cwd}/examples/src/screens/Login.ts\n` +
          `- ${cwd}/examples/src/screens/Login.test.ts\n`,
      );
    });
  });

  describe('--config --template --name', () => {
    it('should complete successfully', async () => {
      const cwd = createMinimalProject();

      const result = await spawnAsync(
        cliPath,
        [`--config=${configFlag}`, '--template=screen', '--name=Login'],
        { cwd },
      );

      expect(result.status).toBe(0);
      expect(stripAnsi(result.stdout)).toMatch(
        '✅  Success!\n' +
          'Output files:\n' +
          `- ${cwd}/examples/src/screens/Login.ts\n` +
          `- ${cwd}/examples/src/screens/Login.test.ts\n`,
      );
    });
  });
});

describe('InitCommand', () => {
  it('should create file', async () => {
    const cwd = createMinimalProject();

    const result = await spawnAsync(
      cliPath,
      [`--config=${configFlag}`, '--template=screen', '--name=Login'],
      { cwd },
    );

    expect(result.status).toBe(0);
    expect(stripAnsi(result.stdout)).toMatch(
      '✅  Success!\n' +
        'Output files:\n' +
        `- ${cwd}/examples/src/screens/Login.ts\n` +
        `- ${cwd}/examples/src/screens/Login.test.ts\n`,
    );
  });

  describe('should fail', function () {
    it('[Given] working directory not clean', async () => {
      const cwd = createMinimalProject({ git: { dirty: true, init: true } });

      const t = await spawnAsync(cliPath, ['init'], {
        cwd,
      }).catch(async e => e as spawnAsync.SpawnPromise<spawnAsync.SpawnResult>);

      expect(t.status).toBe(1);
      expect(t.stdout).toMatchInlineSnapshot(`
          "We caught an error during execution, this probably isn't a bug.
          Check your 'scribe.config.ts', and ensure all files exist and paths are correct.

          If you think this might be a bug, please report it here: https://github.com/kieran-osgood/scribe/issues/new.

          You can enable verbose logging with --v, --verbose.

          ⚠️ Working directory not clean"
        `);
    });

    it('[Given] file already exists', async () => {
      const cwd = createMinimalProject();

      const t = await spawnAsync(cliPath, ['init'], {
        cwd,
      }).catch(async e => e as spawnAsync.SpawnPromise<spawnAsync.SpawnResult>);

      expect(t.status).toBe(1);
      expect(t.stdout).toMatchInlineSnapshot(`
        "We caught an error during execution, this probably isn't a bug.
        Check your 'scribe.config.ts', and ensure all files exist and paths are correct.

        If you think this might be a bug, please report it here: https://github.com/kieran-osgood/scribe/issues/new.

        You can enable verbose logging with --v, --verbose.

        Error: File ${cwd}/scribe.config.ts already exists."
      `);
    });
  });
});

describe('HelpCommand', function () {
  it('should print help text', async () => {
    const t = await spawnAsync(cliPath, [`--help`]);

    expect(t.status).toBe(0);
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
  });
});

describe('VersionCommand', () => {
  it('should print version', async () => {
    const t = await spawnAsync(cliPath, [`--version`]);
    expect(t.status).toBe(0);
    expect(stripAnsi(t.stdout)).toMatchInlineSnapshot(`
        "${packageJson.version}
        "
      `);
  });
});

describe('DefinitionsCommand', () => {
  it('should print definitions', async () => {
    const t = await spawnAsync(cliPath, ['--clipanion=definitions']);
    expect(t.status).toBe(0);
    expect(stripAnsi(t.stdout)).toMatchInlineSnapshot(`
      "[
        {
          \\"path\\": \\"scribe\\",
          \\"usage\\": \\"scribe\\",
          \\"description\\": \\"Scribe generates files based on mustache templates.\\\\n\\",
          \\"examples\\": [
            [
              \\"Interactively select template to use\\\\n\\",
              \\"scribe\\"
            ],
            [
              \\"Select via args\\\\n\\",
              \\"scribe --template screen --name Login\\"
            ]
          ],
          \\"options\\": [
            {
              \\"definition\\": \\"-c,--config #0\\",
              \\"description\\": \\"Path to the config (default: scribe.config.ts)\\",
              \\"required\\": false
            },
            {
              \\"definition\\": \\"--verbose\\",
              \\"description\\": \\"More verbose logging and error stack traces\\",
              \\"required\\": false
            },
            {
              \\"definition\\": \\"-n,--name #0\\",
              \\"description\\": \\"The key of templates to generate.\\",
              \\"required\\": false
            },
            {
              \\"definition\\": \\"-t,--template #0\\",
              \\"description\\": \\"Specify the name of the template to generate. Must be a key under templates in config.\\",
              \\"required\\": false
            }
          ]
        },
        {
          \\"path\\": \\"scribe init\\",
          \\"usage\\": \\"scribe init\\",
          \\"description\\": \\"Generates a scribe.config.ts file.\\\\n\\",
          \\"examples\\": [],
          \\"options\\": [
            {
              \\"definition\\": \\"-c,--config #0\\",
              \\"description\\": \\"Path to the config (default: scribe.config.ts)\\",
              \\"required\\": false
            },
            {
              \\"definition\\": \\"--verbose\\",
              \\"description\\": \\"More verbose logging and error stack traces\\",
              \\"required\\": false
            }
          ]
        }
      ]
      "
    `);
  });
});
