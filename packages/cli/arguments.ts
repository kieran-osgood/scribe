import { Options } from '@effect/cli';

export const VerboseLogging = Options.boolean('verbose').pipe(
  Options.withDescription('Sets LogLevel to All (default: false)'),
  Options.withDefault(false),
);

export const TemplateName = Options.text('name').pipe(
  Options.withAlias('n'),
  Options.withDescription('The key of templates to generate.'),
  Options.optional,
);

export const Template = Options.text('template').pipe(
  Options.withAlias('t'),
  Options.withDescription(
    'Specify the name of the template to generate. Must be a key under templates in config.',
  ),
  Options.optional,
);

export const ConfigPath = Options.text('config').pipe(
  Options.withAlias('c'),
  Options.withDescription('Path to the config (default: scribe.config.ts)'),
  Options.withDefault('scribe.config.ts'),
);
