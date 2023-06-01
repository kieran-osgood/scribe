import * as Cli from '@scribe/cli';
import { Effect, pipe } from '@scribe/core';
import { green, red } from 'colorette';

export function main() {
  return pipe(
    Cli.run(),
    Effect.flatMap(() =>
      Effect.sync(() => {
        console.log(green('Exiting'));
        process.exit(0);
      })
    ),
    Effect.catchAll(error =>
      Effect.sync(() => {
        console.error(red(String(error)));
        process.exit(1);
      })
    )
  );
}
