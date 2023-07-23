import { Effect } from '@scribe/core';
import inquirer, { Answers, QuestionCollection } from 'inquirer';

import { fmtError } from '../../error';
import { PromptError } from './error';

export const prompt = (
  questions: QuestionCollection,
  initialAnswers?: Partial<Answers>,
) =>
  Effect.tryCatchPromise(
    () => inquirer.prompt(questions, initialAnswers),
    cause =>
      new PromptError({ message: `Prompt failed: ${fmtError(cause)}`, cause }),
  );
