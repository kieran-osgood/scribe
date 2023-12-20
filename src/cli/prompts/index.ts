import { Prompt } from '@effect/cli';
import { Effect } from 'effect';

export const fileName = Prompt.text({
  message: 'Name:',
  validate: s =>
    /^([A-Za-z\-_\d])+$/.test(s)
      ? Effect.succeed(s)
      : Effect.fail(
          'File name may only include letters, numbers & underscores.',
        ),
});

export const continueWarning = Prompt.toggle({
  message: 'Continue?',
  active: 'yes',
  inactive: 'no',
});

export const templates = (s: string[]) =>
  Prompt.select({
    message: 'Template:',
    choices: s.map(_ => ({
      title: _,
      value: _,
      // https://github.com/kieran-osgood/scribe/issues/32
      // description: 'This is some description of a template',
    })),
  });
