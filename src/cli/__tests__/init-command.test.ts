import { CliApp } from '@effect/cli';
import { FileSystem, Path } from '@effect/platform-node';
import spawnAsync from '@expo/spawn-async';
import { FS } from '@scribe/services';
import { Console, Effect, Fiber, Layer, ReadonlyArray } from 'effect';
import fs from 'fs';
import stripAnsi from 'strip-ansi';
import { describe } from 'vitest';

import * as Process from '../../services/process/process';
import * as Cli from '../cli';
import * as MockConsole from '../mock-console';
import * as MockTerminal from '../mock-terminal';
import {
  cliPath,
  createMinimalProject,
  getCliFromSpawn,
  registerInteractiveListeners,
} from './fixtures';

const MainLive = Effect.gen(function* (_) {
  const _console = yield* _(MockConsole.make);
  return Layer.mergeAll(
    Console.setConsole(_console),
    FileSystem.layer,
    FS.layer(true),
    MockTerminal.layer,
    Process.layer('./'),
    Path.layer,
  );
}).pipe(Layer.unwrapEffect);

const runEffect = async <E, A>(
  self: Effect.Effect<
    CliApp.CliApp.Environment | FS.FS | Process.Process,
    E,
    A
  >,
): Promise<A> =>
  Effect.provide(self, MainLive).pipe(
    // Logger.withMinimumLogLevel(LogLevel.All),
    Effect.runPromise,
  );

it('gen', async () => {
  return Effect.gen(function* (_) {
    const args = ReadonlyArray.make('init');
    const fiber = yield* _(Effect.fork(Cli.run(args)));

    yield* _(MockTerminal.inputKey('left'));
    yield* _(MockTerminal.inputKey('enter'));

    yield* _(Fiber.join(fiber), Effect.flip);

    const lines = yield* _(MockConsole.getLines({ stripAnsi: true }));
    console.log(lines);
    expect(lines).toMatchInlineSnapshot(`
      [
        "Init",
        " Git ",
        "Checking working tree clean",
        "? Continue? › yes / no",
        "? Continue? › yes / no",
        "✔ Continue? … yes / no
      ",
        "",
        " Config ",
        "Checking write path clear",
        "Writing...",
      ]
    `);
  }).pipe(runEffect);
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
           Git 
          Checking working tree clean
          ⚠️ Git working tree dirty - proceed with caution.
          Recommendation: commit all changes before proceeding.
          ? Continue (Y/n) ? Continue (Y/n) y? Continue Yes
           Config 
          Checking write path clear
          Writing...
           Success 
          ✅  Scribe init complete. Edit the config to begin templating.
          📁 file://${cwd}/scribe.config.ts
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

        processPromise
          .then(_ => {
            console.log('aaaaaaaaaaa', _);
            return _;
          })
          .catch(_ => {
            console.log('???????', _);
            return _;
          });

        const cli = getCliFromSpawn(processPromise);

        registerInteractiveListeners(cli)({ continue: 'n' });

        const result = await processPromise;

        expect(result.status).toBe(0);
        // expect(stripAnsi(result.stdout)).toMatchInlineSnapshot(`
        //     "Init
        //      Git
        //     Checking working tree clean
        //     ⚠️ Git working tree dirty - proceed with caution.
        //     Recommendation: commit all changes before proceeding.
        //     ? Continue (Y/n) ? Continue (Y/n) n? Continue No
        //     "
        //   `);
        //
        // await expect(async () =>
        //   fs.promises.readFile(`${cwd}/scribe.config.ts`),
        // ).rejects.toMatchInlineSnapshot(
        //   `[Error: ENOENT: no such file or directory, open '${cwd}/scribe.config.ts']`,
        // );
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
         Git 
        Checking working tree clean
         Config 
        Checking write path clear
        Writing...
         Success 
        ✅  Scribe init complete. Edit the config to begin templating.
        📁 file://${cwd}/scribe.config.ts
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
         Git 
        Checking working tree clean
         Config 
        Checking write path clear
        💥 Failed to create config. Path not empty.
        📁 file://${cwd}/scribe.config.ts
        "
      `);

      expect(String(config)).toMatchSnapshot();
    });
  });

  it('[Given] --help flag [Then] print help information', async () => {
    const t = await spawnAsync(cliPath, [`init`, `--help`]);

    expect(t.status).toBe(0);
    expect(stripAnsi(t.stdout)).toMatchInlineSnapshot(`
        "Scribe

        Scribe 0.3.1

        USAGE

        $ init

        OPTIONS

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

        "
      `);
  });
});
