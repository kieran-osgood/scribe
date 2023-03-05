import { getUserTemplateOptions } from "./reader/config.js";
import { readFlags } from "./reader/arguments.js";
import { readPrompt } from "./reader/prompt.js";

import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";

export async function run() {
  const program = pipe(
    TE.Do,
    TE.bindW("choices", getUserTemplateOptions),
    TE.bindW("flags", ({ choices }) => readFlags(choices)),
    TE.bindW("selections", (opts) => readPrompt(opts))
  );

  const result = await program();
  console.log(result);

  // // Write files based on selections.template option
  // const fileName = fileNameFormatter(
  //   selections.data.template,
  //   selections.data.name
  // );
}
