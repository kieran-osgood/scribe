import { readConfigFlag, readFlags } from './reader/arguments.js';
import { C, flow, IO, O, pipe } from './common/fp';
import * as Effect from '@effect/io/Effect';
import { readConfig, readUserTemplateOptions } from './reader/config';
import { readPrompt } from './reader/prompt';

const program = Effect.gen(function* ($) {
  const configPath = yield* $(readConfigFlag());
  const config = yield* $(readConfig(configPath));
  const templates = yield* $(readUserTemplateOptions(configPath));
  const flags = yield* $(readFlags(templates));
  const input = yield* $(readPrompt({ templates, flags }));

  return { configPath, config, templates, input, flags };
});

export async function run() {
  Effect.runPromise(program).then(abc => {
    console.log('123', abc);
  });

  // // Write files based on selections.template option
  // const fileName = fileNameFormatter(
  //   selections.data.template,
  //   selections.data.name
  // );
}

const ExitStatus = {
  success: 0,
  error: 2,
} as const;
type ExitStatusKey = keyof typeof ExitStatus;

const exit =
  (exitStatusKey: ExitStatusKey) =>
  (error?: unknown): IO.IO<never> =>
    pipe(
      O.fromNullable(error),
      IO.of,
      IO.map(
        flow(
          exitLogToConsole, //
          // import * as Exit from "@effect/io/Exit";
          () => process.exit(ExitStatus[exitStatusKey])
        )
      )
    );

// prettier-ignore
const CError = (prefix = '') => (error: unknown = '') => {
  return C.error(prefix + error)();
};

const exitLogToConsole = O.match(CError('An unknown error occurred'), CError());
