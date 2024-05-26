import { Prompt } from '@effect/cli';
import { QuitException } from '@effect/platform/Terminal';
import * as Constants from '@scribe/constants';
import * as Git from '@scribe/git';
import { Console, Effect } from 'effect';

const ToggleContinue = Prompt.toggle({
  message: 'Continue?',
  active: 'yes',
  inactive: 'no',
});

const ToggleContinueOrQuit = ToggleContinue.pipe(
  Effect.if({
    onTrue: () => Effect.void,
    onFalse: () => Effect.fail(new QuitException()),
  }),
);

const InputFileName = Prompt.text({
  message: 'Name:',
  validate: s =>
    Effect.if(/^([A-Za-z\-_\d])+$/.test(s), {
      onTrue: () => Effect.succeed(s),
      onFalse: () =>
        Effect.fail(
          'File name may only include letters, numbers & underscores.',
        ),
    }),
});

// const SelectTemplate = (s: [string, readonly GeneratorConfig[]][]) =>
//   Prompt.select({
//     message: 'Generator File:',
//     choices: s.map(([key, generator]) => ({
//       title: `${key}.scribe`,
//       value: key,
//       // https://github.com/kieran-osgood/scribe/issues/32
//       // description: generator.description ?? '',
//     })),
//   });

const SelectTemplate = (s: string[]) =>
  Prompt.select({
    message: 'Generator File:',
    choices: s.map(_ => ({
      title: `${_}.scribe`,
      value: _,
      // https://github.com/kieran-osgood/scribe/issues/32
      // description: generator.description ?? '',
    })),
  });

const DirtyGitCheck = () =>
  Git.isWorkingTreeClean().pipe(
    Effect.flatMap(
      Effect.if({
        onTrue: () => Effect.void,
        onFalse: () =>
          Effect.gen(function* ($) {
            yield* $(Console.warn(Constants.WARNINGS.gitWorkingDirectoryDirty));
            yield* $(Prompts.ToggleContinueOrQuit);
          }),
      }),
    ),
  );

export const Prompts = {
  ToggleContinueOrQuit,
  ToggleContinue,
  InputFileName,
  SelectTemplate,
  DirtyGitCheck,
};
