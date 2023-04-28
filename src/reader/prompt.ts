import { z } from 'zod';
import { pipe, SStd } from '../common/fp';
import { Flags } from './arguments.js';
import { fmtError } from '../error';
import inquirer, { QuestionCollection } from 'inquirer';
import * as Effect from '@effect/io/Effect';
import { TaggedClass } from '@effect/data/Data';

class PromptError extends TaggedClass('PromptError')<{
  readonly error: string;
  readonly cause?: unknown;
}> {}

const promptSchema = z
  .object({
    template: z.string(),
    name: z.string(),
  })
  .brand<'Prompt'>();
type Prompt = z.infer<typeof promptSchema>;

type CreateQuestionsOptions = {
  templates: string[];
  flags: Flags;
};

function createQuestions(options: CreateQuestionsOptions): QuestionCollection {
  const { templates, flags } = options;

  return [
    {
      name: 'template',
      type: 'list',
      message: 'Pick your template',
      choices: templates,
      when: () => Boolean(flags.template) === false,
    },
    {
      name: 'name',
      type: 'input',
      message: 'File name:',
      when: () => Boolean(flags.name) === false,
      validate: (s: string) => {
        if (/^([A-Za-z\-_\d])+$/.test(s)) return true;
        return 'File name may only include letters, numbers & underscores.';
      },
    },
  ];
}

export function readPrompt(options: { templates: string[]; flags: Flags }) {
  return pipe(
    Effect.tryCatchPromise(
      () => inquirer.prompt(createQuestions(options)),
      error =>
        new PromptError({
          error: `Prompt failed: ${fmtError(error)}`,
          cause: error,
        })
    ),
    Effect.map(SStd.merge(options.flags)),
    Effect.flatMap(parsePrompt)
  );
}

function parsePrompt(response: unknown) {
  return Effect.tryCatch(
    () => promptSchema.parse(response),
    error =>
      new PromptError({
        error: `Parsing prompt failed: ${fmtError(error)}`,
        cause: error,
      })
  );
}
