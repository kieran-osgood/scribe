import { Command, Option } from 'clipanion';
import * as t from 'typanion';
import { Effect, pipe } from '@scribe/core';
import { BaseCommand } from './BaseCommand';
import { generateProgramInputs } from '../program';

export class DefaultCommand extends BaseCommand {
  static override paths = [Command.Default];

  static override usage = Command.Usage({
    description: 'Scribe generates files based on mustache templates.',
    // details: ``,
    examples: [
      [`Interactively select template to use`, `$0`],
      [`Select via args`, `$0 --template screen --name Login`],
    ],
  });

  name = Option.String('-n,--name', {
    description: 'The key of templateOptions to generate.',
    validator: t.isString(),
    required: false,
  });

  template = Option.String('-t,--template', {
    description: '',
    validator: t.isString(),
    required: false,
  });

  executeSafe = () => {
    return pipe(
      Effect.succeed(''), //
      Effect.flatMap(_ => generateProgramInputs),
      Effect.map(_ => {
        this.name = _.input.name;
        this.template = _.input.template;
      }),
      Effect.tap(_ => Effect.log('a' + JSON.stringify(_)))
    );
  };
}
