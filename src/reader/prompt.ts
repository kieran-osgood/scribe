import inquirer, { QuestionCollection } from "inquirer";
import { z } from "zod";
import { pipe } from "fp-ts/lib/function.js";
import * as TE from "fp-ts/lib/TaskEither.js";
import * as E from "fp-ts/lib/Either.js";
import { formatErrorMessage } from "../error/index.js";
import { Flags } from "./arguments.js";

type CreateQuestionsOptions = {
  templates: string[];
  flags: Flags;
};

function createQuestions(options: CreateQuestionsOptions): QuestionCollection {
  const { templates, flags } = options;
  return [
    {
      name: "template",
      type: "list",
      message: "Pick your template",
      choices: templates,
      when: () => Boolean(flags.template) === false,
    },
    {
      name: "name",
      type: "input",
      message: "File name:",
      when: () => Boolean(flags.name) === false,
      validate: (s: string) => {
        if (/^([A-Za-z\-_\d])+$/.test(s)) return true;
        return "File name may only include letters, numbers & underscores.";
      },
    },
  ];
}

const promptSchema = z
  .object({
    template: z.string(),
    name: z.string(),
  })
  .brand<"Prompt">();
type Prompt = z.infer<typeof promptSchema>;

function parsePrompt(res: unknown): TE.TaskEither<Error, Prompt> {
  return TE.tryCatch(
    async () => promptSchema.parse(res),
    (error) =>
      new Error(`Parsing prompt failed: ${formatErrorMessage(error)}`, {
        cause: error,
      })
  );
}

export function readPrompt(opts: { templates: string[]; flags: Flags }) {
  return pipe(
    TE.tryCatch(
      () => inquirer.prompt(createQuestions(opts)), //
      E.toError
    ),
    TE.chainW(parsePrompt)
  );
}
