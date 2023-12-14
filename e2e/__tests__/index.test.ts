// noinspection DuplicatedCode

import spawnAsync from '@expo/spawn-async';
import { ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import stripAnsi from 'strip-ansi';
import { describe } from 'vitest';

import packageJson from '../../package.json';
import { arrowKey, createMinimalProject } from '../fixtures';

const cliPath = path.join(process.cwd(), 'dist', 'index.js');
const configFlag = path.join('scribe.config.ts');

const createDataListener = (cli: ChildProcess) => (cb: (s: string) => void) => {
  cli.stdout?.on('data', (data: { toString(): string }) => {
    cb(data.toString());
  });
};
type Responses = {
  continue?: 'y' | 'n';
  templatePicker?: string;
  fileName?: string;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const registerInteractiveListeners = (cli: ChildProcess) => {
  return (responses: Responses) => {
    const registerOnDataListener = createDataListener(cli);

    if (responses.continue) {
      registerOnDataListener(s => {
        if (s.includes('Continue')) cli.stdin?.write(`${responses.continue}\n`);
      });
    }

    if (responses.templatePicker) {
      registerOnDataListener(s => {
        if (s.includes('Pick your template'))
          cli.stdin?.write(`${responses.templatePicker}\n`);
      });
    }

    if (responses.fileName) {
      registerOnDataListener(s => {
        if (s.includes('File name'))
          cli.stdin?.write(`${responses.fileName}\n`);
      });
    }
  };
};

const getCliFromSpawn = (
  _: spawnAsync.SpawnPromise<spawnAsync.SpawnResult>,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (_.child === null) {
    throw new Error('spawned process is null');
  }

  return _.child;
};

describe('DefaultCommand', () => {
  describe('[Given] Flag passed in: --config & fully interactive session', () => {
    it('[Then] creates two files', async () => {
      const cwd = createMinimalProject();

      const processPromise = spawnAsync(cliPath, [`--config=${configFlag}`], {
        cwd,
      });

      const cli = getCliFromSpawn(processPromise);

      registerInteractiveListeners(cli)({
        templatePicker: arrowKey.down,
        fileName: 'Login',
      });

      const result = await processPromise;

      expect(result.status).toBe(0);
      expect(stripAnsi(result.stdout)).toMatch(
        '✅  Success!\n' +
          'Output files:\n' +
          `- ${cwd}/examples/src/screens/Login.ts\n` +
          `- ${cwd}/examples/src/screens/Login.test.ts\n`,
      );

      const loginscreen = fs.readFileSync(
        `${cwd}/examples/src/screens/Login.ts`,
      );
      expect(String(loginscreen)).toMatchSnapshot();

      const loginscreentest = fs.readFileSync(
        `${cwd}/examples/src/screens/Login.test.ts`,
      );
      expect(String(loginscreentest)).toMatchSnapshot();
    });
  });

  describe('[Given] only --name passed in', () => {
    it('[Then] creates two files', async () => {
      const cwd = createMinimalProject();

      const processPromise = spawnAsync(
        cliPath,
        [`--config=${configFlag}`, '--name=Login'],
        {
          cwd,
        },
      );

      const cli = getCliFromSpawn(processPromise);

      registerInteractiveListeners(cli)({
        templatePicker: arrowKey.down,
      });

      const result = await processPromise;

      expect(result.status).toBe(0);
      expect(stripAnsi(result.stdout)).toMatch(
        '✅  Success!\n' +
          'Output files:\n' +
          `- ${cwd}/examples/src/screens/Login.ts\n` +
          `- ${cwd}/examples/src/screens/Login.test.ts\n`,
      );

      const loginscreen = fs.readFileSync(
        `${cwd}/examples/src/screens/Login.ts`,
      );
      expect(String(loginscreen)).toMatchSnapshot();

      const loginscreentest = fs.readFileSync(
        `${cwd}/examples/src/screens/Login.test.ts`,
      );
      expect(String(loginscreentest)).toMatchSnapshot();
    });
  });

  describe('[Given] only --template passed in', () => {
    it('[Then] creates two files', async () => {
      const cwd = createMinimalProject();

      const processPromise = spawnAsync(
        cliPath,
        [`--config=${configFlag}`, '--template=screen'],
        {
          cwd,
        },
      );

      const cli = getCliFromSpawn(processPromise);

      registerInteractiveListeners(cli)({
        fileName: 'Login',
      });

      const result = await processPromise;

      expect(result.status).toBe(0);
      expect(stripAnsi(result.stdout)).toMatch(
        '✅  Success!\n' +
          'Output files:\n' +
          `- ${cwd}/examples/src/screens/Login.ts\n` +
          `- ${cwd}/examples/src/screens/Login.test.ts\n`,
      );

      const loginscreen = fs.readFileSync(
        `${cwd}/examples/src/screens/Login.ts`,
      );
      expect(String(loginscreen)).toMatchSnapshot();

      const loginscreentest = fs.readFileSync(
        `${cwd}/examples/src/screens/Login.test.ts`,
      );
      expect(String(loginscreentest)).toMatchSnapshot();
    });
  });

  describe('[Given] all flags used: --config --template --name', () => {
    it('[Then] creates two files', async () => {
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

      const loginscreen = fs.readFileSync(
        `${cwd}/examples/src/screens/Login.ts`,
      );
      expect(String(loginscreen)).toMatchSnapshot();

      const loginscreentest = fs.readFileSync(
        `${cwd}/examples/src/screens/Login.test.ts`,
      );
      expect(String(loginscreentest)).toMatchSnapshot();
    });
  });
});

describe('InitCommand', () => {
  describe('[Given] Git dirty', () => {
    describe('[Then] prompt user to continue', () => {
      it('[When] user accepts [Then] create file', async () => {
        const cwd = createMinimalProject({
          git: { dirty: true, init: true },
          fixtures: { configFile: false, templateFiles: false, base: true },
        });

        const processPromise = spawnAsync(cliPath, ['init'], { cwd });

        const cli = getCliFromSpawn(processPromise);

        registerInteractiveListeners(cli)({ continue: 'y' });

        const result = await processPromise;

        expect(result.status).toBe(0);
        expect(stripAnsi(result.stdout)).toMatchInlineSnapshot(`
            "Init
            Checking working tree clean
            ⚠️ Git working tree dirty - proceed with caution.
            Recommendation: commit all changes before proceeding.
            ? Continue (Y/n) ? Continue (Y/n) y? Continue Yes
            Checking Config path clear
            Writing...
            ✅  Success
            📁 file://${cwd}/scribe.config.ts
            "
          `);
        expect(result.stdout).toMatchInlineSnapshot(`
            "[34m[44m[30mInit[34m[49m[39m
            [34mChecking working tree clean[39m
            ⚠️ [33mGit working tree dirty - proceed with caution.
            Recommendation: commit all changes before proceeding.[39m
            [32m?[39m [1mContinue[22m[0m [0m[2m(Y/n) [22m[17D[17C[2K[G[32m?[39m [1mContinue[22m[0m [0m[2m(Y/n) [22my[18D[18C[2K[G[32m?[39m [1mContinue[22m[0m [0m[36mYes[39m[14D[14C
            [34mChecking Config path clear[39m
            [34mWriting...[39m
            [34m✅  [32mSuccess[34m[39m
            [34m📁 file://${cwd}/scribe.config.ts[39m
            "
          `);

        const config = fs.readFileSync(`${cwd}/scribe.config.ts`);
        expect(String(config)).toMatchSnapshot();
      });

      it('[When] user declines [Then] abort without writing', async () => {
        const cwd = createMinimalProject({
          git: { dirty: true, init: true },
          fixtures: { configFile: false, templateFiles: false, base: true },
        });

        const processPromise = spawnAsync(cliPath, ['init'], { cwd });

        const cli = getCliFromSpawn(processPromise);

        registerInteractiveListeners(cli)({ continue: 'n' });

        const result = await processPromise;

        expect(result.status).toBe(0);
        expect(stripAnsi(result.stdout)).toMatchInlineSnapshot(`
            "Init
            Checking working tree clean
            ⚠️ Git working tree dirty - proceed with caution.
            Recommendation: commit all changes before proceeding.
            ? Continue (Y/n) ? Continue (Y/n) n? Continue No
            "
          `);
        expect(result.stdout).toMatchInlineSnapshot(`
            "[34m[44m[30mInit[34m[49m[39m
            [34mChecking working tree clean[39m
            ⚠️ [33mGit working tree dirty - proceed with caution.
            Recommendation: commit all changes before proceeding.[39m
            [32m?[39m [1mContinue[22m[0m [0m[2m(Y/n) [22m[17D[17C[2K[G[32m?[39m [1mContinue[22m[0m [0m[2m(Y/n) [22mn[18D[18C[2K[G[32m?[39m [1mContinue[22m[0m [0m[36mNo[39m[13D[13C
            "
          `);

        await expect(async () =>
          fs.promises.readFile(`${cwd}/scribe.config.ts`),
        ).rejects.toMatchInlineSnapshot(
          `[Error: ENOENT: no such file or directory, open '${cwd}/scribe.config.ts']`,
        );
      });
    });
  });

  describe('[Given] Git Clean', () => {
    it('[When] filepath clear [Then] create file', async () => {
      const cwd = createMinimalProject({
        git: { dirty: false, init: true },
        fixtures: { configFile: false, templateFiles: false, base: true },
      });

      const result = await spawnAsync(cliPath, ['init'], { cwd });

      expect(result.status).toBe(0);
      expect(stripAnsi(result.stdout)).toMatchInlineSnapshot(`
          "Init
          Checking working tree clean
          Checking Config path clear
          Writing...
          ✅  Success
          📁 file://${cwd}/scribe.config.ts
          "
        `);
      expect(result.stdout).toMatchInlineSnapshot(`
          "[34m[44m[30mInit[34m[49m[39m
          [34mChecking working tree clean[39m
          [34mChecking Config path clear[39m
          [34mWriting...[39m
          [34m✅  [32mSuccess[34m[39m
          [34m📁 file://${cwd}/scribe.config.ts[39m
          "
        `);

      const config = fs.readFileSync(`${cwd}/scribe.config.ts`);
      expect(String(config)).toMatchSnapshot();
    });

    it('[When] filepath full [then] print failure', async () => {
      const cwd = createMinimalProject();

      const config = fs.readFileSync(`${cwd}/scribe.config.ts`);
      const t = await spawnAsync(cliPath, ['init'], {
        cwd,
      });

      expect(t.status).toBe(0);
      expect(stripAnsi(t.stdout)).toMatchInlineSnapshot(`
        "Init
        Checking working tree clean
        Checking Config path clear
        💥 Failed to create config. Path not empty: ${cwd}/scribe.config.ts
        "
      `);

      expect(String(config)).toMatchSnapshot();
    });
  });
});

describe('HelpCommand', function () {
  it('[Given] --help flag [Then] print help information', async () => {
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
  it('[Given] --version flag [Then] print version from package.json', async () => {
    const t = await spawnAsync(cliPath, [`--version`]);
    expect(t.status).toBe(0);
    expect(stripAnsi(t.stdout)).toMatchInlineSnapshot(`
        "${packageJson.version}
        "
      `);
  });
});

describe('DefinitionsCommand', () => {
  it('[Given] --clipanion=definitions flag [Then] print json spec', async () => {
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
