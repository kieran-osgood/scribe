import { Effect } from 'effect';
import inquirer, { Answers, QuestionCollection } from 'inquirer';

import { fmtError } from '../../common/error';
import { PromptError } from './error';

export const prompt = (
  questions: QuestionCollection,
  initialAnswers?: Partial<Answers>,
) =>
  Effect.tryPromise({
    try: async () => inquirer.prompt(questions, initialAnswers),
    catch: cause =>
      new PromptError({ message: `Prompt failed: ${fmtError(cause)}`, cause }),
  });
