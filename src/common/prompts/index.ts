import { Prompt } from '@effect/cli';
import { QuitException } from '@effect/platform/Terminal';
import { Effect, pipe } from 'effect';

const fileName = Prompt.text({
  message: 'Name:',
  validate: s =>
    /^([A-Za-z\-_\d])+$/.test(s)
      ? Effect.succeed(s)
      : Effect.fail(
          'File name may only include letters, numbers & underscores.',
        ),
});

const continueWarning = Prompt.toggle({
  message: 'Continue?',
  active: 'yes',
  inactive: 'no',
});

const templates = (s: string[]) =>
  Prompt.select({
    message: 'Template:',
    choices: s.map(_ => ({
      title: _,
      value: _,
      // https://github.com/kieran-osgood/scribe/issues/32
      // description: 'This is some description of a template',
    })),
  });

const continueOrQuit = () =>
  pipe(
    Prompts.continueWarning,
    Effect.if({
      onTrue: Effect.unit,
      onFalse: Effect.fail(new QuitException()),
    }),
  );

export const Prompts = {
  templates,
  continueWarning,
  continueOrQuit,
  fileName,
};
