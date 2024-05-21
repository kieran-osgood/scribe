import { Array, Effect, Fiber } from 'effect';
import fs from 'fs';
import path from 'path';

import packageJson from '../../../package.json';
import * as MockConsole from '../../../test/mock-console.js';
import * as MockTerminal from '../../../test/mock-terminal.js';
import { createMinimalProject, runEffect } from '../../../test/utils.js';
import { readConfig } from '../../config/index.js';
import * as Cli from '../cli.js';

describe('[Given] Git Clean', () => {
  it('[When] user accepts [Then] create schema compatible file', async () => {
    const cwd = createMinimalProject({
      git: { dirty: false, init: true },
      fixtures: { configFile: false, templateFiles: false },
    });

    return Effect.gen(function* ($) {
      const args = Array.make('', '', 'init');
      const fiber = yield* $(Effect.fork(Cli.run(args)));

      yield* $(MockTerminal.inputKey('left'));
      yield* $(MockTerminal.inputKey('enter'));

      yield* $(Fiber.join(fiber));

      const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
      expect(lines).toMatchInlineSnapshot(`
        [
          "                                Init                               ",
          " Git ",
          "Checking working tree clean",
          " Config ",
          "Checking write path clear",
          "Writing...",
          " Success ",
          "✅",
          "Scribe init complete. Edit the config to begin templating.",
          "📁 file://${cwd}/scribe.config.ts",
        ]
      `);
      const configPath = path.join(cwd, `scribe.config.ts`);
      const configTxt = fs.readFileSync(configPath).toString();
      expect(configTxt).toMatchSnapshot();

      const result = yield* $(readConfig(configPath));
      expect(result).toEqual({
        options: { rootOutDir: '.', templatesDirectories: ['.'] },
        templates: {},
      });
    }).pipe(runEffect(cwd));
  });

  it('[When] filepath full [then] print failure', async () => {
    const cwd = createMinimalProject();

    return Effect.gen(function* ($) {
      const config = fs.readFileSync(`${cwd}/scribe.config.ts`);
      const args = Array.make('', '', 'init');
      const fiber = yield* $(Effect.fork(Cli.run(args)));

      yield* $(MockTerminal.inputKey('left'));
      yield* $(MockTerminal.inputKey('enter'));

      yield* $(Fiber.join(fiber));

      const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
      expect(lines).toMatchInlineSnapshot(`
        [
          "                                Init                               ",
          " Git ",
          "Checking working tree clean",
          " Config ",
          "Checking write path clear",
          " Fail ",
          "Failed to create config. Path not empty.",
          "📁 file://${cwd}/scribe.config.ts",
        ]
      `);
      expect(String(config)).toMatchSnapshot();
    }).pipe(runEffect(cwd));
  });
});

describe('[Given] Git dirty', () => {
  describe('[Then] prompt user to continue', () => {
    it('[When] user accepts [Then] create file', async () => {
      const cwd = createMinimalProject({
        git: { dirty: true, init: true },
        fixtures: { configFile: false, templateFiles: false },
      });

      return Effect.gen(function* ($) {
        const args = Array.make('', '', 'init');
        const fiber = yield* $(Effect.fork(Cli.run(args)));

        yield* $(MockTerminal.inputKey('left'));
        yield* $(MockTerminal.inputKey('enter'));

        yield* $(Fiber.join(fiber));

        const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
        expect(lines).toMatchInlineSnapshot(`
          [
            "                                Init                               ",
            " Git ",
            "Checking working tree clean",
            "Git working tree dirty - proceed with caution.
          Recommendation: commit all changes before proceeding.",
            "? Continue? › yes / no",
            "? Continue? › yes / no",
            "✔ Continue? … yes / no
          ",
            "",
            " Config ",
            "Checking write path clear",
            "Writing...",
            " Success ",
            "✅",
            "Scribe init complete. Edit the config to begin templating.",
            "📁 file://${cwd}/scribe.config.ts",
          ]
        `);
      }).pipe(runEffect(cwd));
    });

    it('[When] user declines [Then] abort without writing', async () => {
      const cwd = createMinimalProject({
        git: { dirty: true, init: true },
        fixtures: { configFile: false, templateFiles: false },
      });

      return Effect.gen(function* ($) {
        const args = Array.make('', '', 'init');
        const fiber = yield* $(Effect.fork(Cli.run(args)));

        yield* $(MockTerminal.inputKey('enter'));

        yield* $(Fiber.join(fiber));

        const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
        expect(lines).toMatchInlineSnapshot(`
            [
              "                                Init                               ",
              " Git ",
              "Checking working tree clean",
              "Git working tree dirty - proceed with caution.
            Recommendation: commit all changes before proceeding.",
              "? Continue? › yes / no",
              "✔ Continue? … yes / no
            ",
              "",
            ]
          `);

        expect(() =>
          fs.readFileSync(`${cwd}/scribe.config.ts`),
        ).toThrowErrorMatchingInlineSnapshot(
          `[Error: ENOENT: no such file or directory, open '${cwd}/scribe.config.ts']`,
        );
      }).pipe(runEffect(cwd));
    });
  });
});

it('[Given] --help flag [Then] print help information', async () => {
  const cwd = createMinimalProject();

  return Effect.gen(function* ($) {
    const args = Array.make('', '', 'init', '--help');
    const fiber = yield* $(Effect.fork(Cli.run(args)));

    yield* $(Fiber.join(fiber));

    const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
    expect(lines).toMatchInlineSnapshot(`
      [
        "Scribe

      Scribe ${packageJson.version}

      USAGE

      $ init [--verbose]

      OPTIONS

      --verbose

        A true or false value.

        Sets LogLevel to All (default: false)

        This setting is optional.

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
      ",
      ]
    `);
  }).pipe(runEffect(cwd));
});
