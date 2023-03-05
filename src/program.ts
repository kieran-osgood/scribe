import { getUserTemplateOptions } from "./reader/config.js";
import { readFlags } from "./reader/arguments.js";
import { readPrompt } from "./reader/prompt.js";

import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import * as E from "fp-ts/lib/Either.js";

function exit(err: unknown) {
  console.log(err);
  return process.exit(1);
}

export async function run() {
  const runProgram = pipe(
    TE.Do,
    TE.bindW("choices", getUserTemplateOptions),
    TE.bindW("flags", readFlags),
    TE.bindW("selections", readPrompt)
  );

  const result = await runProgram();
  pipe(
    result,
    E.fold(exit, (args) => console.log(args))
  );
  // // Write files based on selections.template option
  // const fileName = fileNameFormatter(
  //   selections.data.template,
  //   selections.data.name
  // );
}
