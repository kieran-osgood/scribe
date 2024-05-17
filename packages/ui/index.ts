import { Prompt } from '@effect/cli';
import { QuitException } from '@effect/platform/Terminal';
import { Effect } from 'effect';

const continueWarning = Prompt.toggle({
  message: 'Continue?',
  active: 'yes',
  inactive: 'no',
});

const continueOrQuit = continueWarning.pipe(
  Effect.if({
    onTrue: () => Effect.void,
    onFalse: () => Effect.fail(new QuitException()),
  }),
);

const fileName = Prompt.text({
  message: 'Name:',
  validate: s =>
    /^([A-Za-z\-_\d])+$/.test(s)
      ? Effect.succeed(s)
      : Effect.fail(
          'File name may only include letters, numbers & underscores.',
        ),
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

export const Prompts = {
  continueOrQuit,
  continueWarning,
  fileName,
  templates,
};
