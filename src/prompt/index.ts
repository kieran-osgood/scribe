import { z } from 'zod';
import { pipe, SStd } from '../common/core';
import { fmtError } from '../common/error';
import inquirer, { Answers, QuestionCollection } from 'inquirer';
import * as Effect from '@effect/io/Effect';
import { TaggedClass } from '@effect/data/Data';

type Flags = { template: string | undefined; name: string | undefined };

type LaunchPromptInterface = {
  templates: string[];
  flags: Flags;
};

export function launchPromptInterface(
  options: LaunchPromptInterface
): Effect.Effect<never, PromptError, Prompt> {
  return pipe(
    options,
    makeQuestionCollection,
    tryInquirerPrompt,
    Effect.map(
      SStd.merge({ name: options.flags.name, template: options.flags.template })
    ),
    Effect.flatMap(tryParsePrompt)
  );
}

class PromptError extends TaggedClass('PromptError')<{
  readonly error: string;
  readonly cause?: unknown;
}> {}

const prompt = z
  .object({ template: z.string(), name: z.string() })
  .brand<'Prompt'>();
type Prompt = z.infer<typeof prompt>;

// We should just be passing the full context?
type MakeQuestionsOptions = {
  templates: string[];
  flags: Flags;
};

function makeQuestionCollection(
  options: MakeQuestionsOptions
): QuestionCollection {
  const { templates, flags } = options;

  return [
    {
      name: 'template',
      type: 'list',
      message: 'Pick your template',
      choices: templates,
      when: () =>
        Boolean(flags.template) === false ||
        typeof options.flags.template !== 'string',
    },
    {
      name: 'name',
      type: 'input',
      message: 'File name:',
      when: () =>
        Boolean(flags.name) === false || typeof options.flags.name !== 'string',
      validate: (s: string) => {
        if (/^([A-Za-z\-_\d])+$/.test(s)) return true;
        return 'File name may only include letters, numbers & underscores.';
      },
    },
  ];
}

const tryInquirerPrompt = (
  questions: QuestionCollection,
  initialAnswers?: Partial<Answers>
) =>
  Effect.tryCatchPromise(
    () => inquirer.prompt(questions, initialAnswers),
    cause =>
      new PromptError({
        error: `Prompt failed: ${fmtError(cause)}`,
        cause,
      })
  );

const tryParsePrompt = (response: unknown) =>
  Effect.tryCatch(
    () => prompt.parse(response),
    cause =>
      new PromptError({
        error: `Parsing prompt failed: ${fmtError(cause)}`,
        cause,
      })
  );
