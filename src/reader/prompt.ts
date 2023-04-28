import { z } from 'zod';
import { pipe, SStd } from '../common/fp';
import { Flags } from './arguments.js';
import { fmtError } from '../error';
import inquirer, { Answers, QuestionCollection } from 'inquirer';
import * as Effect from '@effect/io/Effect';
import { TaggedClass } from '@effect/data/Data';

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
    Effect.map(SStd.merge(options.flags)),
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

const tryInquirerPrompt = (
  questions: QuestionCollection,
  initialAnswers?: Partial<Answers>
) =>
  Effect.tryCatchPromise(
    () => inquirer.prompt(questions, initialAnswers),
    error =>
      new PromptError({
        error: `Prompt failed: ${fmtError(error)}`,
        cause: error,
      })
  );

const tryParsePrompt = (response: unknown) =>
  Effect.tryCatch(
    () => prompt.parse(response),
    _ =>
      new PromptError({
        error: `Parsing prompt failed: ${fmtError(_)}`,
        cause: _,
      })
  );
