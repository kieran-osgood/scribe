import { flow, pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import * as O from "fp-ts/lib/Option.js";
import * as IO from "fp-ts/lib/IO.js";

import { readUserTemplateOptions } from "./reader/config.js";
import { readFlags } from "./reader/arguments.js";
import { readPrompt } from "./reader/prompt.js";
import { curry2 } from "fp-ts-std/Function";

export async function run() {
  const RunProgramInit = pipe(
    TE.Do,
    TE.bindW("templates", readUserTemplateOptions),
    TE.bindW("flags", readFlags),
    TE.bindW("input", readPrompt),
    TE.fold(
      curry2(exit)("error"), //
      TE.right
    )
    // TE.map(console.log)
  );

  await RunProgramInit();

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
          // Error missing
          () => {},
          console.error
        ),
        () => process.exit(ExitStatus[exitStatusKey])
      )
    )
  );
}
