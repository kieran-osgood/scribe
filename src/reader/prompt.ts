import inquirer from "inquirer";
import { z } from "zod";
import { Flags } from "./arguments.js";
import { pipe } from "fp-ts/lib/function.js";

function createQuestions({
  choices,
  flags,
}: {
  choices: string[];
  flags: Flags;
}) {
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
      message: "Project name:",
      when: () => Boolean(flags.name) === false,
      validate: (s: string) => {
        if (/^([A-Za-z\-\_\d])+$/.test(s)) return true;
        else
          return "Project name may only include letters, numbers, underscores and hashes.";
      },
    },
  ];
}

const promptSchema = z.object({
  template: z.string(),
  name: z.string(),
});

export function readPrompt(opts: { choices: string[]; flags: Flags }) {
  return pipe(
    opts, //
    createQuestions,
    inquirer.prompt,
    promptSchema.safeParse
  );
}
