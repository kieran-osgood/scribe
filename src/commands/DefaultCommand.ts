import { Command, Option } from 'clipanion';
import * as t from 'typanion';

import { Chunk, Effect, pipe, RA } from '@scribe/core';
import { checkWorkingTreeClean } from '@scribe/git';

import { promptUserForMissingArgs } from '../context';
import { BaseCommand } from './BaseCommand';
import { constructTemplate, Ctx, writeTemplate } from '../templates';
import { Template } from '@scribe/config';

export class DefaultCommand extends BaseCommand {
  static override paths = [Command.Default];

  static override usage = Command.Usage({
    description: 'Scribe generates files based on mustache templates.',
    examples: [
      [`Interactively select template to use`, `$0`],
      [`Select via args`, `$0 --template screen --name Login`],
    ],
  });

  name = Option.String('-n,--name', {
    description: 'The key of templates to generate.',
    validator: t.isString(),
    required: false,
  });

  template = Option.String('-t,--template', {
    description:
      'Specify the name of the template to generate. Must be a key under templates in config.',
    validator: t.isString(),
    required: false,
  });

  executeSafe = () =>
    pipe(
      checkWorkingTreeClean(),
      Effect.flatMap(() =>
        pipe(
          promptUserForMissingArgs({
            name: this.name,
            template: this.template,
            configPath: this.configPath,
          }),
          Effect.map(_ => {
            this.name = _.input.name;
            this.template = _.input.template;
            return _;
          })
        )
      ),
      Effect.map(_ =>
        pipe(
          _.config.templates[_.input.template]?.outputs ?? [],
          RA.map(templateOutput => createTemplate({ templateOutput, ..._ }))
        )
      ),
      Effect.flatMap(Effect.collectAll),
      Effect.map(Chunk.flatten),
      Effect.flatMap(Effect.forEach(s => s)),
      Effect.map(_ => {
        const results = pipe(
          _,
          Chunk.map(s => `- ${s}`),
          Chunk.join('\n')
        );
        console.log(`✅ Generation Successful!\n\nOutput files:\n${results}\n`);
        return _;
      })
    );
}

/**
 * Wrap writeTemplate with Effect.gen
 * to keep track of the filePaths without process.cwd()
 * or return array of full paths and string.replace process.cwd()
 */
const createTemplate = (ctx: Ctx & { templateOutput: Template }) => {
  return pipe(
    Effect.gen(function* ($) {
      const templates = yield* $(
        pipe(constructTemplate(ctx), Effect.collectAll)
      );

      return pipe(
        templates,
        Chunk.map(writeTemplate),
        Chunk.map(Effect.flatten)
      );
    })
  );
};
