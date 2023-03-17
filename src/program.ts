import { flow, pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import * as O from "fp-ts/lib/Option.js";
import * as IO from "fp-ts/lib/IO.js";
import * as C from "fp-ts/lib/Console.js";
import { readConfigFlag, readFlags } from "./reader/arguments.js";
import { readUserConfig, readUserTemplateOptions } from "./reader/config.js";
import { readPrompt } from "./reader/prompt";

export async function run() {
  const RunProgramInit = pipe(
    TE.Do,
    TE.bindW("configPath", readConfigFlag),
    TE.bindW("config", ({ configPath }) => readUserConfig(configPath)),
    TE.bindW("templates", readUserTemplateOptions),
    TE.bindW("flags", readFlags),
    TE.bindW("input", readPrompt),
    TE.getOrElse(exit("error"))
  );

  const a = await RunProgramInit();
  console.log(a);
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
          () => process.exit(ExitStatus[exitStatusKey])
        )
      )
    );

// prettier-ignore
const CError = (prefix = '') => (error: unknown = '') => {
  return C.error(prefix + error)();
};

const exitLogToConsole = O.fold(CError("An unknown error occurred"), CError());
