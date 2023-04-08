import { z } from 'zod';
import { identity, pipe, SStd } from '../common/fp';
import { Flags } from './arguments.js';
import { formatErrorMessage } from '../error';
import inquirer, { QuestionCollection } from 'inquirer';
import * as Effect from '@effect/io/Effect';

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

const promptSchema = z
  .object({
    template: z.string(),
    name: z.string(),
  })
  .brand<'Prompt'>();
type Prompt = z.infer<typeof promptSchema>;

function parsePrompt(res: unknown): Effect.Effect<never, Error, Prompt> {
  return Effect.tryCatchPromise(
    async () => promptSchema.parse(res),
    error =>
      new Error(`Parsing prompt failed: ${formatErrorMessage(error)}`, {
        cause: error,
      })
  );
}

export function readPrompt(opts: { templates: string[]; flags: Flags }) {
  return pipe(
    Effect.tryCatchPromise(
      () => inquirer.prompt(createQuestions(opts)), //
      identity
    ),
    Effect.map(SStd.merge(opts.flags)),
    Effect.flatMap(parsePrompt)
  );
}
