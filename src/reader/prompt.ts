import inquirer from "inquirer";
import { z } from "zod";
import { Flags } from "./arguments.js";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import * as E from "fp-ts/lib/Either.js";
import * as T from "fp-ts/lib/Task.js";

type CreateQuestionsOptions = {
  choices: string[];
  flags: Flags;
};

function createQuestions({ choices, flags }: CreateQuestionsOptions) {
  return [
    {
      name: "template",
      type: "list",
      message: "Pick your template",
      choices,
      when: () => Boolean(flags.template) === false,
    },
    {
      name: "name",
      type: "input",
      message: "File name:",
      when: () => Boolean(flags.name) === false,
      validate: (s: string) => {
        if (/^([A-Za-z\-\_\d])+$/.test(s)) return true;
        else
          return "File name may only include letters, numbers & underscores.";
      },
    },
  ];
}

const promptSchema = z.object({
  template: z.string(),
  name: z.string(),
});

function decodeError(e: unknown): Error {
  return new Error("oops");
}

export function readPrompt(opts: { choices: string[]; flags: Flags }) {
  return pipe(
    TE.tryCatch(
      () => inquirer.prompt(createQuestions(opts)),
      (e) => e
    ),
    TE.chainW((res) =>
      pipe(TE.of(promptSchema.parse(res)), TE.mapLeft(decodeError))
    )
    // TE.fold(
    //   (e) => T.of(`oh no, an error occurred: ${e}`),
    //   (film) => T.of(`Film recovered succesfully, title is: ${film}`)
    // )
  );
}
