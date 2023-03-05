import { readUserTemplateOptions } from "./reader/config.js";
import { readFlags } from "./reader/arguments.js";
import { readPrompt } from "./reader/prompt.js";

import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";

function exit(err: unknown) {
  console.log(err);
  return process.exit(1);
}

export async function run() {
  const RunProgramInit = pipe(
    TE.Do,
    TE.bindW("templates", readUserTemplateOptions),
    TE.bindW("flags", readFlags),
    TE.bindW("selections", readPrompt),
    TE.fold(exit, TE.right),
    TE.map((args) => console.log(args))
  );

  await RunProgramInit();

  // // Write files based on selections.template option
  // const fileName = fileNameFormatter(
  //   selections.data.template,
  //   selections.data.name
  // );
}
