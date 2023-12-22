import { Effect, Fiber } from 'effect';
import fs from 'fs';
import path from 'path';

import * as Cli from '../cli';
import * as MockConsole from '../mock-console';
import * as MockTerminal from '../mock-terminal';
import { configFlag, createMinimalProject, runEffect } from './fixtures';

describe('DefaultCommand', () => {
  describe('[Given] Git clean', () => {
    describe('[When] `--config` passed in & fully interactive session', () => {
      it('[Then] creates two files', async () => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: false },
          fixtures: { templateFiles: true, configFile: true, base: true },
        });
        const configPath = path.join(cwd, configFlag);

        return Effect.gen(function* ($) {
          const fiber = yield* $(
            Effect.fork(Cli.run([`--config=${configPath}`])),
          );

          yield* $(MockTerminal.inputKey('down'));
          yield* $(MockTerminal.inputKey('enter'));
          yield* $(MockTerminal.inputText('Login'));
          yield* $(MockTerminal.inputKey('enter'));

          yield* $(Fiber.join(fiber));

          const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
          expect(lines).toMatchInlineSnapshot(`
            [
              "? Template: › 
            ❯ component 
              screen ",
              "? Template: › 
              component 
            ❯ screen ",
              "✔ Template: …  screen
            ",
              "",
              "? Name: › ",
              "? Name: › L",
              "? Name: › Lo",
              "? Name: › Log",
              "? Name: › Logi",
              "? Name: › Login",
              "✔ Name: … Login
            ",
              "",
              "✅  Success",
              "Output files:
            - ${cwd}/examples/src/screens/Login.ts
            - ${cwd}/examples/src/screens/Login.test.ts
            ",
            ]
          `);

          const loginscreen = fs.readFileSync(
            path.join(cwd, `examples/src/screens/Login.ts`),
          );
          expect(String(loginscreen)).toMatchSnapshot();

          const loginscreentest = fs.readFileSync(
            path.join(cwd, `examples/src/screens/Login.test.ts`),
          );
          expect(String(loginscreentest)).toMatchSnapshot();
        }).pipe(runEffect(cwd));
      });
    });

    describe('[When] `--name` passed in', () => {
      it('[Then] creates two files', async () => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: false },
          fixtures: { templateFiles: true, configFile: true, base: true },
        });
        const configPath = path.join(cwd, configFlag);

        return Effect.gen(function* ($) {
          const fiber = yield* $(
            Effect.fork(Cli.run([`--config=${configPath}`, '--name=Login'])),
          );

          yield* $(MockTerminal.inputKey('down'));
          yield* $(MockTerminal.inputKey('enter'));

          yield* $(Fiber.join(fiber));

          const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
          expect(lines).toMatchInlineSnapshot(`
            [
              "? Template: › 
            ❯ component 
              screen ",
              "? Template: › 
              component 
            ❯ screen ",
              "✔ Template: …  screen
            ",
              "",
              "✅  Success",
              "Output files:
            - ${cwd}/examples/src/screens/Login.ts
            - ${cwd}/examples/src/screens/Login.test.ts
            ",
            ]
          `);

          const loginscreen = fs.readFileSync(
            path.join(cwd, `examples/src/screens/Login.ts`),
          );
          expect(String(loginscreen)).toMatchSnapshot();

          const loginscreentest = fs.readFileSync(
            path.join(cwd, `examples/src/screens/Login.test.ts`),
          );
          expect(String(loginscreentest)).toMatchSnapshot();
        }).pipe(runEffect(cwd));
      });
    });

    describe('[When] `--template` passed in', () => {
      it('[Then] creates two files', async () => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: false },
          fixtures: { templateFiles: true, configFile: true, base: true },
        });
        const configPath = path.join(cwd, configFlag);

        return Effect.gen(function* ($) {
          const fiber = yield* $(
            Effect.fork(
              Cli.run([`--config=${configPath}`, '--template=screen']),
            ),
          );

          yield* $(MockTerminal.inputText('Login'));
          yield* $(MockTerminal.inputKey('enter'));

          yield* $(Fiber.join(fiber));

          const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
          expect(lines).toMatchInlineSnapshot(`
          [
            "? Name: › ",
            "? Name: › L",
            "? Name: › Lo",
            "? Name: › Log",
            "? Name: › Logi",
            "? Name: › Login",
            "✔ Name: … Login
          ",
            "",
            "✅  Success",
            "Output files:
          - ${cwd}/examples/src/screens/Login.ts
          - ${cwd}/examples/src/screens/Login.test.ts
          ",
          ]
        `);

          const loginscreen = fs.readFileSync(
            path.join(cwd, `examples/src/screens/Login.ts`),
          );
          expect(String(loginscreen)).toMatchSnapshot();

          const loginscreentest = fs.readFileSync(
            path.join(cwd, `examples/src/screens/Login.test.ts`),
          );
          expect(String(loginscreentest)).toMatchSnapshot();
        }).pipe(runEffect(cwd));
      });
    });

    describe('[Given] `--config --template --name passed` in', () => {
      it('[Then] creates two files', async () => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: false },
          fixtures: { templateFiles: true, configFile: true, base: true },
        });
        const configPath = path.join(cwd, configFlag);

        return Effect.gen(function* ($) {
          const fiber = yield* $(
            Effect.fork(
              Cli.run([
                `--config=${configPath}`,
                '--name=Login',
                '--template=screen',
              ]),
            ),
          );

          yield* $(Fiber.join(fiber));

          const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
          expect(lines).toMatchInlineSnapshot(`
          [
            "✅  Success",
            "Output files:
          - ${cwd}/examples/src/screens/Login.ts
          - ${cwd}/examples/src/screens/Login.test.ts
          ",
          ]
        `);

          const loginscreen = fs.readFileSync(
            path.join(cwd, `examples/src/screens/Login.ts`),
          );
          expect(String(loginscreen)).toMatchSnapshot();

          const loginscreentest = fs.readFileSync(
            path.join(cwd, `examples/src/screens/Login.test.ts`),
          );
          expect(String(loginscreentest)).toMatchSnapshot();
        }).pipe(runEffect(cwd));
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
        const configPath = path.join(cwd, configFlag);

        return Effect.gen(function* ($) {
          const fiber = yield* $(
            Effect.fork(
              Cli.run([
                `--config=${configPath}`,
                '--name=Login',
                '--template=screen',
              ]),
            ),
          );

          yield* $(MockTerminal.inputKey('left'));
          yield* $(MockTerminal.inputKey('enter'));

          yield* $(Fiber.join(fiber));

          const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
          expect(lines).toMatchInlineSnapshot(`
    [
      "Git working tree dirty - proceed with caution.
    Recommendation: commit all changes before proceeding.",
      "? Continue? › yes / no",
      "? Continue? › yes / no",
      "✔ Continue? … yes / no
    ",
      "",
      "✅  Success",
      "Output files:
    - ${cwd}/examples/src/screens/Login.ts
    - ${cwd}/examples/src/screens/Login.test.ts
    ",
    ]
  `);

          const loginscreen = fs.readFileSync(
            path.join(cwd, `examples/src/screens/Login.ts`),
          );
          expect(String(loginscreen)).toMatchSnapshot();

          const loginscreentest = fs.readFileSync(
            path.join(cwd, `examples/src/screens/Login.test.ts`),
          );
          expect(String(loginscreentest)).toMatchSnapshot();
        }).pipe(runEffect(cwd));
      });

      it('[Then] user answers `n`, cli aborts without writing file', async () => {
        const cwd = createMinimalProject({
          git: { init: true, dirty: true },
          fixtures: { configFile: true, base: true, templateFiles: true },
        });
        const configPath = path.join(cwd, configFlag);

        return Effect.gen(function* ($) {
          const fiber = yield* $(
            Effect.fork(
              Cli.run([
                `--config=${configPath}`,
                '--name=Login',
                '--template=screen',
              ]),
            ),
          );

          yield* $(MockTerminal.inputKey('enter'));

          yield* $(Fiber.join(fiber));

          const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
          expect(lines).toMatchInlineSnapshot(`
            [
              "Git working tree dirty - proceed with caution.
            Recommendation: commit all changes before proceeding.",
              "? Continue? › yes / no",
              "✔ Continue? … yes / no
            ",
              "",
            ]
          `);
        }).pipe(runEffect(cwd));
      });
    });
  });

  describe('[Given] *Not* Git', function () {
    describe('[Given] prompts to continue', () => {
      it('[Then] user answers y, creates two files', async () => {
        const cwd = createMinimalProject({
          git: { init: false, dirty: false },
          fixtures: { configFile: true, base: true, templateFiles: true },
        });
        const configPath = path.join(cwd, configFlag);

        return Effect.gen(function* ($) {
          const fiber = yield* $(
            Effect.fork(
              Cli.run([
                `--config=${configPath}`,
                '--name=Login',
                '--template=screen',
              ]),
            ),
          );

          yield* $(MockTerminal.inputKey('left'));
          yield* $(MockTerminal.inputKey('enter'));

          yield* $(Fiber.join(fiber));

          const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
          expect(lines).toMatchInlineSnapshot(`
              [
                "? Continue? › yes / no",
                "? Continue? › yes / no",
                "✔ Continue? … yes / no
              ",
                "",
                "✅  Success",
                "Output files:
              - ${cwd}/examples/src/screens/Login.ts
              - ${cwd}/examples/src/screens/Login.test.ts
              ",
              ]
            `);
        }).pipe(runEffect(cwd));
      });

      it('[Then] user answers `n`, cli aborts without writing file', async () => {
        const cwd = createMinimalProject({
          git: { init: false, dirty: false },
          fixtures: { configFile: true, base: true, templateFiles: true },
        });
        const configPath = path.join(cwd, configFlag);
        return Effect.gen(function* ($) {
          const fiber = yield* $(
            Effect.fork(
              Cli.run([
                `--config=${configPath}`,
                '--name=Login',
                '--template=screen',
              ]),
            ),
          );

          yield* $(MockTerminal.inputKey('enter'));

          yield* $(Fiber.join(fiber));

          const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));

          expect(lines).toMatchInlineSnapshot(
            '[\n  "? Continue? › yes / no",\n  "✔ Continue? … yes / no\n",\n  "",\n]',
          );
        }).pipe(runEffect(cwd));
      });
    });
  });

  it('[Given] --help flag [Then] print help information', async () => {
    const cwd = createMinimalProject();

    return Effect.gen(function* ($) {
      const fiber = yield* $(Effect.fork(Cli.run(['--help'])));
      yield* $(Fiber.join(fiber));
      const lines = yield* $(MockConsole.getLines({ stripAnsi: true }));
      expect(lines).toMatchInlineSnapshot(`
        [
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
        ",
        ]
      `);
    }).pipe(runEffect(cwd));
  });
});
