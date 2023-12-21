import spawnAsync from '@expo/spawn-async';
import fs from 'fs';
import stripAnsi from 'strip-ansi';
import { describe } from 'vitest';

import {
  arrowKey,
  cliPath,
  configFlag,
  createMinimalProject,
  getCliFromSpawn,
  registerInteractiveListeners
} from './fixtures';

describe('DefaultCommand', () => {
  describe('[Given] Git clean', () => {
    describe('[When] `--config` passed in & fully interactive session', () => {
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

    describe('[When] `--name` passed in', () => {
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

    describe('[When] `--template` passed in', () => {
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

    describe('[Given] `--config --template --name passed` in', () => {
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

  describe('[Given] Git Dirty', function () {
    describe('[Given] prompts to continue', () => {
      it('[Then] user answers `y`, creates two files', async () => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: true },
          fixtures: { configFile: true, base: true, templateFiles: true },
        });

        const processPromise = spawnAsync(
          cliPath,
          [`--config=${configFlag}`, '--template=screen', '--name=Login'],
          { cwd },
        );

        const cli = getCliFromSpawn(processPromise);

        registerInteractiveListeners(cli)({
          continue: 'y',
        });

        const result = await processPromise;

        expect(result.status).toBe(0);
        expect(stripAnsi(result.stdout)).toMatchInlineSnapshot(`
          "⚠️ Git working tree dirty - proceed with caution.
          Recommendation: commit all changes before proceeding.
          ? Continue (Y/n) ? Continue (Y/n) y? Continue Yes
          ✅  Success!
          Output files:
          - ${cwd}/examples/src/screens/Login.ts
          - ${cwd}/examples/src/screens/Login.test.ts
          "
        `);

        const loginscreen = fs.readFileSync(
          `${cwd}/examples/src/screens/Login.ts`,
        );
        expect(String(loginscreen)).toMatchSnapshot();

        const loginscreentest = fs.readFileSync(
          `${cwd}/examples/src/screens/Login.test.ts`,
        );
        expect(String(loginscreentest)).toMatchSnapshot();
      });

      it('[Then] user answers `n`, cli aborts without writing file', async () => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: true },
          fixtures: { configFile: true, base: true, templateFiles: true },
        });

        const processPromise = spawnAsync(
          cliPath,
          [`--config=${configFlag}`, '--template=screen', '--name=Login'],
          { cwd },
        );

        const cli = getCliFromSpawn(processPromise);

        registerInteractiveListeners(cli)({
          continue: 'n',
        });

        const result = await processPromise;

        expect(result.status).toBe(0);
        expect(stripAnsi(result.stdout)).toMatchInlineSnapshot(`
          "⚠️ Git working tree dirty - proceed with caution.
          Recommendation: commit all changes before proceeding.
          ? Continue (Y/n) ? Continue (Y/n) n? Continue No
          "
        `);

        await expect(async () =>
          fs.promises.readFile(`${cwd}/examples/src/screens/Login.ts`),
        ).rejects.toMatchInlineSnapshot(
          `[Error: ENOENT: no such file or directory, open '${cwd}/examples/src/screens/Login.ts']`,
        );
      });
    });
  });

  describe.skip('[Given] Not in Git', function () {
    describe('[Given] prompts to continue', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      it('[Then] user answers y, creates two files', async () => {
        const cwd = createMinimalProject({
          git: { init: false, dirty: true },
          fixtures: { configFile: true, base: true, templateFiles: true },
        });

        const processPromise = spawnAsync(
          cliPath,
          [`--config=${configFlag}`, '--template=screen', '--name=Login'],
          { cwd },
        );

        const cli = getCliFromSpawn(processPromise);

        registerInteractiveListeners(cli)({
          continue: 'n',
        });

        const result = await processPromise;

        expect(result.status).toBe(0);
        expect(stripAnsi(result.stdout)).toMatchInlineSnapshot();

        const loginscreen = fs.readFileSync(
          `${cwd}/examples/src/screens/Login.ts`,
        );
        expect(String(loginscreen)).toMatchSnapshot();

        const loginscreentest = fs.readFileSync(
          `${cwd}/examples/src/screens/Login.test.ts`,
        );
        expect(String(loginscreentest)).toMatchSnapshot();
      });

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      it('[Then] user answers `n`, cli aborts without writing file', async () => {
        const cwd = createMinimalProject({
          git: { init: false, dirty: true },
          fixtures: { configFile: true, base: true, templateFiles: true },
        });

        const processPromise = spawnAsync(
          cliPath,
          [`--config=${configFlag}`, '--template=screen', '--name=Login'],
          { cwd },
        );

        const cli = getCliFromSpawn(processPromise);

        registerInteractiveListeners(cli)({
          continue: 'n',
        });

        const result = await processPromise;

        expect(result.status).toBe(0);
        expect(stripAnsi(result.stdout)).toMatchInlineSnapshot();

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

  it('[Given] --help flag [Then] print help information', async () => {
    const t = await spawnAsync(cliPath, [`--help`]);

    expect(t.status).toBe(0);
    expect(stripAnsi(t.stdout)).toMatchInlineSnapshot(`
        "Scribe

        Scribe 0.3.1

        USAGE

        $ scribe [(-c, --config text)] [(-n, --name text)] [(-t, --template text)] [--cwd text]

        OPTIONS

        (-c, --config text)

          A user-defined piece of text.

          Path to the config (default: scribe.config.ts)

          This setting is optional.

        (-n, --name text)

          A user-defined piece of text.

          The key of templates to generate.

          This setting is optional.

        (-t, --template text)

          A user-defined piece of text.

          Specify the name of the template to generate. Must be a key under templates in config.

          This setting is optional.

        --cwd text

          A user-defined piece of text.

          Override the cwd (default: process.cwd()

          This setting is optional.

        --completions sh | bash | fish | zsh

          One of the following: sh, bash, fish, zsh

          Generate a completion script for a specific shell

          This setting is optional.

        (-h, --help)

          A true or false value.

          Show the help documentation for a command

          This setting is optional.

        --wizard

          A true or false value.

          Start wizard mode for a command

          This setting is optional.

        --version

          A true or false value.

          Show the version of the application

          This setting is optional.

        COMMANDS

          - init  

        "
      `);
  });
});
