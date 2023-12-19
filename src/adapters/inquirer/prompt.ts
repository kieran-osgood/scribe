import * as Schema from '@effect/schema/Schema';
import { Effect, pipe, ReadonlyRecord } from 'effect';
import inquirer, { Answers, QuestionCollection } from 'inquirer';
import { Readable, Writable } from 'stream';

import { fmtError } from '../../common/error';
import { PromptError } from './error';

export type Streams = {
  inStream: Readable;
  outStream: Writable;
};
export const prompt = (
  questions: QuestionCollection,
  initialAnswers?: Partial<Answers>,
) =>
  Effect.tryPromise({
    try: async () => inquirer.prompt(questions, initialAnswers),
    catch: cause =>
      new PromptError({
        message: `Prompt failed: ${fmtError(cause)}`,
        cause,
      }),
  });

const ContinueSchema = Schema.struct({
  continue: Schema.boolean,
});

export const continuePrompt = () => {
  return pipe(
    prompt([
      {
        name: 'continue',
        type: 'confirm',
        message: 'Continue',
      },
    ]),
    Effect.flatMap(Schema.parse(ContinueSchema)),
    Effect.map(ReadonlyRecord.get('continue')),
    Effect.flatMap(
      Effect.if({
        onTrue: Effect.succeed(true),
        onFalse: Effect.succeed(false),
      }),
    ),
  );
};
