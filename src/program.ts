import { flow, pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import * as O from "fp-ts/lib/Option.js";
import * as IO from "fp-ts/lib/IO.js";
import * as C from "fp-ts/lib/Console.js";
import { readConfigFlag, readFlags } from "./reader/arguments.js";
import { readUserConfig, readUserTemplateOptions } from "./reader/config.js";
import { readPrompt } from "./reader/prompt";
import { curry2 } from "fp-ts-std/Function";

export async function run() {
  const RunProgramInit = pipe(
    TE.Do,
    TE.bindW("configPath", readConfigFlag),
    TE.bindW("config", ({ configPath }) => readUserConfig(configPath)),
    TE.bindW("templates", readUserTemplateOptions),
    TE.bindW("flags", readFlags),
    TE.bindW("input", readPrompt),
    TE.getOrElse(curry2(exit)("error"))
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

function exit(exitStatusKey: ExitStatusKey, error?: unknown): IO.IO<never> {
  return pipe(
    O.fromNullable(error), //
    IO.of,
    IO.map(
      flow(
        O.fold(
          C.error("An unknown error occurred"), //
          (e) => C.error(e)()
        ),
        () => process.exit(ExitStatus[exitStatusKey])
      )
    )
  );
}
