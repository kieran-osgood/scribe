import { Effect, flow, pipe, S, TaggedClass, TF } from '@scribe/core';
import { fmtError } from '../common/error';
import inquirer, { Answers, QuestionCollection } from 'inquirer';

type Flags = { template: string | undefined; name: string | undefined };

type LaunchPromptInterface = {
  templates: string[];
  flags: Flags;
};

export function launchPromptInterface(options: LaunchPromptInterface) {
  return pipe(
    options,
    makeQuestionCollection,
    tryInquirerPrompt,
    Effect.map(_ => ({
      // TODO: need to validate this in test
      name: options.flags.name,
      template: options.flags.template,
      ..._,
    })),
    Effect.flatMap(
      flow(
        S.parseEffect(Prompt),
        Effect.catchTag('ParseError', error =>
          Effect.fail(
            new PromptError({ message: TF.formatErrors(error.errors) }),
          ),
        ),
      ),
    ),
  );
}

class PromptError extends TaggedClass('PromptError')<{
  readonly message: string;
  readonly cause?: unknown;
}> {
  override toString = () => this.message;
}

const Prompt = S.struct({
  template: S.string,
  name: S.string,
});
export type Prompt = S.To<typeof Prompt>;

// We should just be passing the full context?
type MakeQuestionsOptions = {
  templates: string[];
  flags: Flags;
};

function makeQuestionCollection(
  options: MakeQuestionsOptions,
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
  initialAnswers?: Partial<Answers>,
) =>
  Effect.tryCatchPromise(
    () => inquirer.prompt(questions, initialAnswers),
    cause =>
      new PromptError({
        message: `Prompt failed: ${fmtError(cause)}`,
        cause,
      }),
  );
