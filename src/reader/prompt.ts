import inquirer, { QuestionCollection } from "inquirer";
import { z, ZodError } from "zod";
import { Flags } from "./arguments.js";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";

type CreateQuestionsOptions = {
  choices: string[];
  flags: Flags;
};

function createQuestions({
  choices,
  flags,
}: CreateQuestionsOptions): QuestionCollection {
  return [
    {
      name: "template",
      type: "list",
      message: "Pick your template",
      choices,
      when: () => Boolean(flags.template) === false,
    },
    {
      name: "nae",
      type: "input",
      message: "File name:",
      when: () => Boolean(flags.name) === false,
      validate: (s: string) => {
        if (/^([A-Za-z\-\_\d])+$/.test(s)) return true;
        return "File name may only include letters, numbers & underscores.";
      },
    },
  ];
}

const promptSchema = z.object({
  template: z.string(),
  name: z.string(),
});

function parsePrompt(res: unknown) {
  return TE.tryCatch(
    async () => promptSchema.parse(res),
    (e) =>
      new Error(
        `Parsing prompt failed: ${
          e instanceof ZodError ? `${e.issues}` : String(e)
        }}`
        // { cause: e, }
      )
  );
}

export function readPrompt(opts: { choices: string[]; flags: Flags }) {
  return pipe(
    TE.tryCatch(
      () => inquirer.prompt(createQuestions(opts)),
      (e) => e
    ),
    TE.chainW(parsePrompt)
  );
}
